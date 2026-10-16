import type { Board, Module, Release } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';
const TOKEN_KEY = 'zephyr_startr_gh_token';
const LEGACY_TOKEN_KEYS = ['zephyr_initializer_gh_token', 'zephyrinit_gh_token'];

export function getStoredGitHubToken(): string {
  try {
    const current = localStorage.getItem(TOKEN_KEY);
    if (current) return current;
    for (const legacy of LEGACY_TOKEN_KEYS) {
      const val = localStorage.getItem(legacy);
      if (val) return val;
    }
    return '';
  } catch {
    return '';
  }
}

export function setStoredGitHubToken(token: string): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredGitHubToken();
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  return headers;
}

export async function fetchReleases(): Promise<{ releases: Release[]; source: 'api' | 'cached' | 'bundled'; rateLimitRemaining?: number }> {
  try {
    const res = await fetch(`${GITHUB_API_BASE}/repos/zephyrproject-rtos/zephyr/releases?per_page=30`, {
      headers: getAuthHeaders(),
    });

    const rateLimit = res.headers.get('x-ratelimit-remaining');
    const remaining = rateLimit ? parseInt(rateLimit, 10) : undefined;

    if (res.ok) {
      const data = await res.json();
      const releases: Release[] = [
        {
          tag: 'main',
          name: 'Zephyr main (Development)',
          isBranch: true,
        },
      ];

      for (const r of data) {
        const tag = r.tag_name || '';
        if (!tag || tag.includes('-rc')) continue;
        const isLts = tag.includes('3.7') || tag.includes('3.4') || tag.includes('2.7');
        releases.push({
          tag,
          name: r.name || `Zephyr ${tag}`,
          lts: isLts,
          publishedAt: r.published_at,
        });
      }

      if (releases.length > 1) {
        releases[1].isLatest = true;
      }

      try {
        localStorage.setItem('zephyr_startr_cached_releases', JSON.stringify(releases));
      } catch {
        // Ignore cache write error
      }

      return { releases, source: 'api', rateLimitRemaining: remaining };
    }
  } catch (err) {
    console.warn('Failed to fetch releases from GitHub API, falling back:', err);
  }

  // Try cached releases
  try {
    const cached = localStorage.getItem('zephyr_startr_cached_releases') ||
      localStorage.getItem('zephyr_initializer_cached_releases') ||
      localStorage.getItem('zephyrinit_cached_releases');
    if (cached) {
      return { releases: JSON.parse(cached), source: 'cached' };
    }
  } catch {
    // Ignore cache error
  }

  // Fallback to bundled dataset
  const res = await fetch('./data/releases.json');
  const releases = await res.json();
  return { releases, source: 'bundled' };
}

export async function fetchBoards(): Promise<{ boards: Board[]; source: 'api' | 'cached' | 'bundled' }> {
  // Check local storage cache first if within 24 hours
  try {
    const cached = localStorage.getItem('zephyr_startr_cached_boards') ||
      localStorage.getItem('zephyr_initializer_cached_boards') ||
      localStorage.getItem('zephyrinit_cached_boards');
    const cachedTime = localStorage.getItem('zephyr_startr_cached_boards_time') ||
      localStorage.getItem('zephyr_initializer_cached_boards_time') ||
      localStorage.getItem('zephyrinit_cached_boards_time');
    if (cached && cachedTime && Date.now() - parseInt(cachedTime, 10) < 24 * 60 * 60 * 1000) {
      return { boards: JSON.parse(cached), source: 'cached' };
    }
  } catch {
    // Ignore cache error
  }

  // Load bundled comprehensive dataset
  try {
    const res = await fetch('./data/boards.json');
    if (res.ok) {
      const boards: Board[] = await res.json();
      try {
        localStorage.setItem('zephyr_startr_cached_boards', JSON.stringify(boards));
        localStorage.setItem('zephyr_startr_cached_boards_time', Date.now().toString());
      } catch {
        // Storage limit might be reached
      }
      return { boards, source: 'bundled' };
    }
  } catch (err) {
    console.warn('Failed to load bundled boards, trying fallback:', err);
  }

  // Minimal fallback if fetch fails
  return {
    boards: [
      {
        id: 'nrf52840dk/nrf52840',
        name: 'Nordic nRF52840 DK',
        board: 'nrf52840dk',
        target: 'nrf52840dk_nrf52840',
        vendor: 'Nordic Semiconductor',
        vendorKey: 'nordic',
        arch: 'arm',
        popular: true,
        description: 'Popular Nordic Bluetooth LE 5.4, 802.15.4 development kit',
      },
      {
        id: 'esp32_devkitc_wroom',
        name: 'ESP32 DevKitC WROOM',
        board: 'esp32_devkitc_wroom',
        target: 'esp32_devkitc_wroom',
        vendor: 'Espressif Systems',
        vendorKey: 'espressif',
        arch: 'xtensa',
        popular: true,
        description: 'Wi-Fi & Bluetooth dual-core microcontroller',
      },
      {
        id: 'nucleo_f401re',
        name: 'STM32 Nucleo F401RE',
        board: 'nucleo_f401re',
        target: 'nucleo_f401re',
        vendor: 'STMicroelectronics',
        vendorKey: 'st',
        arch: 'arm',
        popular: true,
        description: 'ARM Cortex-M4 84MHz with Arduino Uno headers',
      },
      {
        id: 'rpi_pico',
        name: 'Raspberry Pi Pico',
        board: 'rpi_pico',
        target: 'rpi_pico',
        vendor: 'Raspberry Pi',
        vendorKey: 'raspberrypi',
        arch: 'arm',
        popular: true,
        description: 'RP2040 dual ARM Cortex-M0+ microcontroller',
      },
      {
        id: 'native_sim',
        name: 'Native Host Simulator (POSIX)',
        board: 'native_sim',
        target: 'native_sim',
        vendor: 'POSIX / Simulator',
        vendorKey: 'posix',
        arch: 'posix',
        popular: true,
        description: 'Run Zephyr natively as a process on Linux / macOS without hardware',
      },
    ],
    source: 'bundled',
  };
}

export async function fetchModules(): Promise<Module[]> {
  try {
    const res = await fetch('./data/modules.json');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to load modules from ./data/modules.json:', err);
  }

  // Basic fallback
  return [
    {
      id: 'logging',
      name: 'Logging Subsystem',
      category: 'Core',
      description: 'Zephyr flexible logging framework',
      kconfig: ['CONFIG_LOG=y', 'CONFIG_LOG_DEFAULT_LEVEL=3'],
      tags: ['log', 'debug'],
      defaultSelected: true,
    },
    {
      id: 'console',
      name: 'Console & Printk',
      category: 'Core',
      description: 'Serial console and printk output',
      kconfig: ['CONFIG_CONSOLE=y', 'CONFIG_UART_CONSOLE=y', 'CONFIG_PRINTK=y'],
      tags: ['printf', 'printk'],
      defaultSelected: true,
    },
    {
      id: 'gpio',
      name: 'GPIO',
      category: 'Drivers',
      description: 'General Purpose Input/Output',
      kconfig: ['CONFIG_GPIO=y'],
      tags: ['pin', 'led', 'button'],
      defaultSelected: true,
    },
  ];
}

export async function fetchRawWestManifest(revision: string): Promise<string | null> {
  try {
    const url = `https://raw.githubusercontent.com/zephyrproject-rtos/zephyr/${revision}/west.yml`;
    const res = await fetch(url);
    if (res.ok) {
      return await res.text();
    }
  } catch (err) {
    console.warn(`Failed to fetch raw west.yml for ${revision}:`, err);
  }
  return null;
}
