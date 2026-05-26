import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';

const chromePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const url = process.env.SMOKE_URL ?? 'http://localhost:5173/';
const port = Number(process.env.CDP_PORT ?? 9233);
const profile = `/private/tmp/aetheria-smoke-profile-${process.pid}`;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestJson(endpoint, options = {}) {
  const response = await fetch(endpoint, options);
  if (!response.ok) throw new Error(`${endpoint} -> ${response.status}`);
  return response.json();
}

async function waitForEndpoint(endpoint, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      return await requestJson(endpoint);
    } catch {
      await wait(120);
    }
  }
  throw new Error(`Timed out waiting for ${endpoint}`);
}

function createCdpClient(wsUrl) {
  const socket = new WebSocket(wsUrl);
  let id = 0;
  const callbacks = new Map();
  const listeners = new Map();

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && callbacks.has(message.id)) {
      const { resolve, reject } = callbacks.get(message.id);
      callbacks.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    listeners.get(message.method)?.forEach((listener) => listener(message.params));
  });

  return {
    ready: new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    }),
    send(method, params = {}) {
      id += 1;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => callbacks.set(id, { resolve, reject }));
    },
    on(method, listener) {
      if (!listeners.has(method)) listeners.set(method, []);
      listeners.get(method).push(listener);
    },
    close() {
      socket.close();
    }
  };
}

async function main() {
  await mkdir(profile, { recursive: true });

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--disable-background-networking',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--window-size=1280,720',
    url
  ], {
    stdio: ['ignore', 'ignore', 'pipe']
  });

  const stderr = [];
  chrome.stderr.on('data', (chunk) => stderr.push(chunk.toString()));

  const errors = [];

  try {
    await waitForEndpoint(`http://127.0.0.1:${port}/json/version`);
    const tabs = await waitForEndpoint(`http://127.0.0.1:${port}/json/list`);
    const page = tabs.find((tab) => tab.type === 'page');
    if (!page) throw new Error('No Chrome page target found.');

    const cdp = createCdpClient(page.webSocketDebuggerUrl);
    await cdp.ready;

    cdp.on('Runtime.exceptionThrown', (params) => {
      errors.push(`exception: ${params.exceptionDetails?.text ?? 'unknown'} ${params.exceptionDetails?.exception?.description ?? ''}`);
    });
    cdp.on('Runtime.consoleAPICalled', (params) => {
      if (['error', 'assert'].includes(params.type)) {
        const text = params.args?.map((arg) => arg.value ?? arg.description ?? '').join(' ');
        errors.push(`console.${params.type}: ${text}`);
      }
    });
    cdp.on('Log.entryAdded', (params) => {
      if (['error', 'violation'].includes(params.entry.level)) {
        errors.push(`log.${params.entry.level}: ${params.entry.text}`);
      }
    });

    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');
    await cdp.send('Log.enable');
    await wait(1300);

    await assertEval(cdp, 'Boolean(document.querySelector("canvas"))', 'Canvas was not created.');
    await assertEval(cdp, 'Boolean(window.__AETHERIA_GAME__)', 'Phaser game debug handle is missing.');
    await waitForEval(cdp, 'window.__AETHERIA_GAME__.scene.isActive("HeroSelectScene")', 4000, 'HeroSelectScene did not start.');

    const size = await evaluate(cdp, {
      expression: '({ width: window.innerWidth, height: window.innerHeight })',
      returnByValue: true
    });
    const { width, height } = size.result.value;
    await click(cdp, Math.round(width / 2 - 122), Math.round(height - 58));
    await waitForEval(cdp, 'window.__AETHERIA_GAME__.scene.isActive("TownScene")', 7000, 'TownScene did not start.');
    await wait(600);

    await startScene(cdp, 'TownScene', 'ForestScene');
    await wait(900);
    await startScene(cdp, 'ForestScene', 'DungeonEntranceScene');
    await wait(900);
    await startScene(cdp, 'DungeonEntranceScene', 'DungeonScene');
    await wait(1700);
    await evaluate(cdp, {
      expression: 'window.__AETHERIA_GAME__.registry.set("victoryRewards", { exp: 1, gold: 1, items: ["sunlit_charm"] }); window.__AETHERIA_GAME__.scene.getScene("DungeonScene").scene.start("VictoryScene");',
      awaitPromise: true
    });
    await waitForEval(cdp, 'window.__AETHERIA_GAME__.scene.isActive("VictoryScene")', 4000, 'VictoryScene did not start.');
    await wait(700);

    cdp.close();

    const seriousChromeErrors = stderr.join('').split('\n').filter((line) => (
      line.includes('Uncaught') ||
      line.includes('TypeError') ||
      line.includes('ReferenceError')
    ));

    if (errors.length || seriousChromeErrors.length) {
      throw new Error([...errors, ...seriousChromeErrors].join('\n'));
    }

    console.log('Smoke passed: title, town, forest, dungeon entrance, dungeon, and victory scenes loaded without console/runtime errors.');
  } finally {
    chrome.kill('SIGTERM');
    await rm(profile, { recursive: true, force: true });
  }
}

async function click(cdp, x, y) {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}

async function startScene(cdp, from, to) {
  await evaluate(cdp, {
    expression: `
      (() => {
        const game = window.__AETHERIA_GAME__;
        if (game.scene.isActive("${from}")) game.scene.stop("${from}");
        game.scene.start("${to}");
        return true;
      })()
    `,
    returnByValue: true,
    awaitPromise: true
  });
  await waitForEval(cdp, `window.__AETHERIA_GAME__.scene.isActive("${to}")`, 5000, `${to} did not start.`);
}

async function assertEval(cdp, expression, message) {
  const result = await evaluate(cdp, { expression, returnByValue: true, awaitPromise: true });
  if (!result.result.value) throw new Error(message);
}

async function waitForEval(cdp, expression, timeout, message) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const result = await evaluate(cdp, { expression, returnByValue: true, awaitPromise: true });
    if (result.result.value) return;
    await wait(120);
  }
  throw new Error(message);
}

async function evaluate(cdp, params) {
  const result = await cdp.send('Runtime.evaluate', params);
  if (result.exceptionDetails) {
    const description = result.exceptionDetails.exception?.description ?? result.exceptionDetails.text ?? 'Runtime.evaluate failed.';
    throw new Error(description);
  }
  return result;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
