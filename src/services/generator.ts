import JSZip from 'jszip';
import type { Board, GeneratedFile, Module, ProjectConfig } from '../types';

export function inferBoardDetails(boardId: string): { vendorKey: string; arch: string; name: string } {
  const id = (boardId || '').toLowerCase();

  if (id.includes('nrf') || id.includes('nordic')) {
    return { vendorKey: 'nordic', arch: 'arm', name: 'Nordic nRF52/nRF53/nRF54 Board' };
  }
  if (id.includes('stm32') || id.includes('nucleo') || id.includes('disco')) {
    return { vendorKey: 'st', arch: 'arm', name: 'STM32 Board' };
  }
  if (id.includes('esp32') || id.includes('esp_') || id.includes('espressif')) {
    const isRiscv = id.includes('c3') || id.includes('c6') || id.includes('p4');
    return { vendorKey: 'espressif', arch: isRiscv ? 'riscv' : 'xtensa', name: 'Espressif ESP32 Board' };
  }
  if (id.includes('pico') || id.includes('rp2040') || id.includes('rp2350')) {
    return { vendorKey: 'raspberrypi', arch: 'arm', name: 'Raspberry Pi Pico' };
  }
  if (id.includes('sam') || id.includes('atmel') || id.includes('microchip') || id.includes('avr')) {
    return { vendorKey: 'atmel', arch: 'arm', name: 'Microchip/Atmel Board' };
  }
  if (id.includes('imx') || id.includes('lpc') || id.includes('nxp') || id.includes('frdm')) {
    return { vendorKey: 'nxp', arch: 'arm', name: 'NXP Board' };
  }
  if (id.includes('efm32') || id.includes('efr32') || id.includes('silabs')) {
    return { vendorKey: 'silabs', arch: 'arm', name: 'Silicon Labs Board' };
  }
  if (id.includes('native') || id.includes('posix') || id.includes('qemu_x86')) {
    return { vendorKey: 'posix', arch: 'posix', name: 'POSIX Simulator' };
  }

  // Fallback default: Most MCU targets in Zephyr are ARM-based
  return { vendorKey: 'unknown', arch: 'arm', name: boardId };
}

export function getVendorHal(vendorKey: string, arch: string): string[] {
  const vk = (vendorKey || '').toLowerCase();
  const a = (arch || '').toLowerCase();

  const hals: string[] = [];

  // ARM architectures (Cortex-M, Cortex-R, Cortex-A) require CMSIS core headers.
  // In Zephyr, Cortex-M uses cmsis_6 for modern releases (v3.7+, v4.x, main)
  // while Cortex-A/R and older releases use cmsis. Both are needed to guarantee
  // cmsis_core.h is present during compilation.
  if (a === 'arm' || a === 'arm64' || !a) {
    hals.push('cmsis');
    hals.push('cmsis_6');
  }

  switch (vk) {
    case 'nordic':
      hals.push('hal_nordic');
      break;
    case 'st':
      hals.push('hal_stm32');
      hals.push('hal_st');
      break;
    case 'espressif':
      hals.push('hal_espressif');
      break;
    case 'raspberrypi':
      hals.push('hal_rpi_pico');
      break;
    case 'nxp':
      hals.push('hal_nxp');
      break;
    case 'ti':
      hals.push('hal_ti');
      break;
    case 'silabs':
      hals.push('hal_silabs');
      break;
    case 'infineon':
    case 'cypress':
      hals.push('hal_infineon');
      break;
    case 'atmel':
    case 'microchip':
      hals.push('hal_atmel');
      hals.push('hal_microchip');
      break;
    case 'renesas':
      hals.push('hal_renesas');
      break;
    case 'ambiq':
      hals.push('hal_ambiq');
      break;
    case 'gigadevice':
    case 'gd':
      hals.push('hal_gigadevice');
      break;
    case 'telink':
      hals.push('hal_telink');
      break;
    case 'nuvoton':
      hals.push('hal_nuvoton');
      break;
    case 'adi':
      hals.push('hal_adi');
      break;
    case 'realtek':
      hals.push('hal_realtek');
      break;
    case 'sifli':
      hals.push('hal_sifli');
      break;
    case 'wch':
      hals.push('hal_wch');
      break;
    case 'posix':
    case 'native':
      // Host simulator doesn't need external HAL repositories
      break;
    default:
      if (a === 'xtensa') {
        hals.push('hal_espressif');
      }
      break;
  }

  return hals;
}

export const ALL_UPSTREAM_WEST_PROJECTS: string[] = [
  'acpica',
  'babblesim_base',
  'babblesim_ext_2G4_channel_NtNcable',
  'babblesim_ext_2G4_channel_multiatt',
  'babblesim_ext_2G4_device_WLAN_actmod',
  'babblesim_ext_2G4_device_burst_interferer',
  'babblesim_ext_2G4_device_playback',
  'babblesim_ext_2G4_libPhyComv1',
  'babblesim_ext_2G4_modem_BLE_simple',
  'babblesim_ext_2G4_modem_magic',
  'babblesim_ext_2G4_phy_v1',
  'babblesim_ext_libCryptov1',
  'bsim',
  'cmsis',
  'cmsis-dsp',
  'cmsis-nn',
  'cmsis_6',
  'dhara',
  'edtt',
  'fatfs',
  'hal_adi',
  'hal_afbr',
  'hal_ambiq',
  'hal_atmel',
  'hal_bouffalolab',
  'hal_espressif',
  'hal_ethos_u',
  'hal_gigadevice',
  'hal_infineon',
  'hal_intel',
  'hal_microchip',
  'hal_nordic',
  'hal_nuvoton',
  'hal_nxp',
  'hal_openisa',
  'hal_quicklogic',
  'hal_realtek',
  'hal_renesas',
  'hal_rpi_pico',
  'hal_sifli',
  'hal_silabs',
  'hal_st',
  'hal_stm32',
  'hal_tdk',
  'hal_telink',
  'hal_ti',
  'hal_wch',
  'hal_wurthelektronik',
  'hal_xtensa',
  'hostap',
  'liblc3',
  'libmctp',
  'libmetal',
  'libsbc',
  'littlefs',
  'lora-basics-modem',
  'loramac-node',
  'lvgl',
  'mbedtls',
  'mcuboot',
  'mipi-sys-t',
  'mldsa-native',
  'nanopb',
  'net-tools',
  'nrf_hw_models',
  'nrf_wifi',
  'open-amp',
  'openthread',
  'percepio',
  'picolibc',
  'psa-arch-tests',
  'reqmgmt',
  'segger',
  'tf-m-tests',
  'tf-psa-crypto',
  'tf-psa-crypto-drivers',
  'trusted-firmware-a',
  'trusted-firmware-m',
  'uoscore-uedhoc',
  'zcbor',
  'zephyr-xenlib',
];

export function generateWestManifest(config: ProjectConfig, modules: Module[], board?: Board): string {
  const allowlistSet = new Set<string>();

  // Determine vendorKey and arch with fallback to boardId inference
  const inferred = inferBoardDetails(config.boardId);
  const vendorKey = board?.vendorKey || inferred.vendorKey;
  const arch = board?.arch || inferred.arch;

  const hals = getVendorHal(vendorKey, arch);
  for (const h of hals) {
    allowlistSet.add(h);
  }

  // Add required West modules from selected modules
  for (const m of modules) {
    if (m.westModules) {
      for (const wm of m.westModules) {
        allowlistSet.add(wm);
      }
    }
  }

  // Combine master upstream projects with any dynamically required projects
  const allProjects = Array.from(new Set<string>([...ALL_UPSTREAM_WEST_PROJECTS, ...allowlistSet])).sort();
  const activeProjects = allProjects.filter((p) => allowlistSet.has(p));

  let allowlistYaml = '';
  for (const item of allProjects) {
    if (allowlistSet.has(item)) {
      allowlistYaml += `          - ${item}\n`;
    } else {
      allowlistYaml += `          # - ${item}\n`;
    }
  }

  return `# West manifest for ${config.name}
# Generated by Zephyr-Startr (https://github.com/zephyrproject-rtos)
# NOTE: Required modules for selected CPU / architecture and features are allowlisted.
# All other upstream Zephyr modules are commented out below. Uncomment any module as needed.
# Use 'west update -n' to perform shallow copies of the repositories.

manifest:
  remotes:
    - name: zephyrproject-rtos
      url-base: https://github.com/zephyrproject-rtos

  projects:
    - name: zephyr
      remote: zephyrproject-rtos
      revision: ${config.zephyrVersion || 'main'}
      import:
        # Active modules (${activeProjects.length}): ${activeProjects.join(', ')}
        name-allowlist:
${allowlistYaml}
  self:
    path: app
`;
}

export function generateCMakeLists(config: ProjectConfig): string {
  const safeName = config.name.replace(/[^a-zA-Z0-9_]/g, '_');
  const lang = config.language || 'c';

  if (lang === 'rust') {
    return `cmake_minimum_required(VERSION 3.20.0)

find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})
project(${safeName})

# Build Rust application using Zephyr cargo integration
rust_cargo_application()
`;
  }

  const srcFile = lang === 'cpp' ? 'src/main.cpp' : 'src/main.c';

  return `cmake_minimum_required(VERSION 3.20.0)

find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})
project(${safeName})

target_sources(app PRIVATE ${srcFile})
`;
}

export function generatePrjConf(config: ProjectConfig, modules: Module[]): string {
  const lines: string[] = [];
  lines.push(`# Project configuration for ${config.name}`);
  lines.push(`# Generated by Zephyr-Startr`);
  lines.push('');

  const categoryMap = new Map<string, string[]>();
  const seenKconfig = new Set<string>();

  const lang = config.language || 'c';
  if (lang === 'cpp') {
    const cppConfigs = ['CONFIG_CPP=y', 'CONFIG_STD_CPP17=y', 'CONFIG_REQUIRES_FULL_LIBCPP=y'];
    categoryMap.set('Programming Language (C++)', cppConfigs);
    for (const kc of cppConfigs) {
      seenKconfig.add(kc);
    }
  } else if (lang === 'rust') {
    const rustConfigs = ['CONFIG_RUST=y'];
    categoryMap.set('Programming Language (Rust)', rustConfigs);
    for (const kc of rustConfigs) {
      seenKconfig.add(kc);
    }
  }

  for (const m of modules) {
    if (m.category === 'Programming Languages') {
      continue;
    }
    if (!categoryMap.has(m.category)) {
      categoryMap.set(m.category, []);
    }
    const catList = categoryMap.get(m.category)!;

    for (const line of m.kconfig) {
      const trimmed = line.trim();
      if (trimmed && !seenKconfig.has(trimmed)) {
        seenKconfig.add(trimmed);
        catList.push(trimmed);
      }
    }
  }

  for (const [cat, kconfigs] of categoryMap.entries()) {
    if (kconfigs.length > 0) {
      lines.push(`# --- ${cat} ---`);
      for (const kc of kconfigs) {
        lines.push(kc);
      }
      lines.push('');
    }
  }

  // Custom user Kconfig options
  if (config.customKconfig && config.customKconfig.length > 0) {
    const customValid = config.customKconfig
      .map((k) => k.trim())
      .filter((k) => k.length > 0 && !seenKconfig.has(k));

    if (customValid.length > 0) {
      lines.push('# --- Custom User Options ---');
      for (const kc of customValid) {
        lines.push(kc);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

export function generateMainC(config: ProjectConfig, modules: Module[], board?: Board): string {
  const moduleIds = new Set(modules.map((m) => m.id));
  const boardId = board ? board.id : config.boardId;
  const boardName = board ? board.name : config.boardId;

  const includes = new Set<string>(['<zephyr/kernel.h>']);

  if (moduleIds.has('logging')) {
    includes.add('<zephyr/logging/log.h>');
  }
  if (moduleIds.has('console')) {
    includes.add('<zephyr/sys/printk.h>');
  }
  if (moduleIds.has('gpio')) {
    includes.add('<zephyr/drivers/gpio.h>');
  }
  if (moduleIds.has('bluetooth')) {
    includes.add('<zephyr/bluetooth/bluetooth.h>');
    includes.add('<zephyr/bluetooth/gatt.h>');
  }
  if (moduleIds.has('sensor')) {
    includes.add('<zephyr/drivers/sensor.h>');
  }
  if (moduleIds.has('shell')) {
    includes.add('<zephyr/shell/shell.h>');
  }
  if (moduleIds.has('usb_device') || moduleIds.has('usb_cdc_acm')) {
    includes.add('<zephyr/usb/usb_device.h>');
  }
  if (moduleIds.has('display') || moduleIds.has('lvgl')) {
    includes.add('<zephyr/drivers/display.h>');
  }
  if (moduleIds.has('settings')) {
    includes.add('<zephyr/settings/settings.h>');
  }
  if (moduleIds.has('flash')) {
    includes.add('<zephyr/drivers/flash.h>');
  }
  if (moduleIds.has('can')) {
    includes.add('<zephyr/drivers/can.h>');
  }
  if (moduleIds.has('networking')) {
    includes.add('<zephyr/net/socket.h>');
  }

  let code = `/*
 * ${config.name}
 * Generated by Zephyr-Startr for ${boardName} (${boardId})
 * SPDX-License-Identifier: Apache-2.0
 */

`;

  for (const inc of Array.from(includes).sort()) {
    code += `#include ${inc}\n`;
  }
  code += '\n';

  if (moduleIds.has('logging')) {
    code += `LOG_MODULE_REGISTER(app, LOG_LEVEL_INF);\n\n`;
  }

  // Blinky support if GPIO is enabled
  const hasGpio = moduleIds.has('gpio');
  if (hasGpio && config.templateId === 'blinky') {
    code += `/* 1000 msec = 1 sec */
#define SLEEP_TIME_MS 1000

/* The devicetree node identifier for the "led0" alias. */
#define LED0_NODE DT_ALIAS(led0)

#if DT_NODE_HAS_STATUS(LED0_NODE, okay)
static const struct gpio_dt_spec led = GPIO_DT_SPEC_GET(LED0_NODE, gpios);
#else
#error "Unsupported board: led0 devicetree alias is not defined"
#endif

`;
  }

  // Shell demo command if shell is enabled
  if (moduleIds.has('shell')) {
    code += `static int cmd_status(const struct shell *sh, size_t argc, char **argv)
{
\tARG_UNUSED(argc);
\tARG_UNUSED(argv);
\tshell_print(sh, "Application: ${config.name}");
\tshell_print(sh, "Target Board: ${boardId}");
\tshell_print(sh, "Kernel Uptime: %lld ms", k_uptime_get());
\treturn 0;
}

SHELL_STATIC_SUBCMD_SET_CREATE(sub_app,
\tSHELL_CMD(status, NULL, "Print application status", cmd_status),
\tSHELL_SUBCMD_SET_END
);
SHELL_CMD_REGISTER(app, &sub_app, "Application commands", NULL);

`;
  }

  code += `int main(void)\n{\n`;

  if (moduleIds.has('logging')) {
    code += `\tLOG_INF("========================================");\n`;
    code += `\tLOG_INF("Starting ${config.name}");\n`;
    code += `\tLOG_INF("Board: ${boardName} (${boardId})");\n`;
    code += `\tLOG_INF("Zephyr Version: ${config.zephyrVersion}");\n`;
    code += `\tLOG_INF("========================================");\n\n`;
  } else {
    code += `\tprintk("========================================\\n");\n`;
    code += `\tprintk("Starting ${config.name}\\n");\n`;
    code += `\tprintk("Board: ${boardName} (${boardId})\\n");\n`;
    code += `\tprintk("========================================\\n");\n\n`;
  }

  if (moduleIds.has('usb_device') || moduleIds.has('usb_cdc_acm')) {
    code += `\tif (usb_enable(NULL)) {\n`;
    code += `\t\tLOG_ERR("Failed to enable USB device");\n`;
    code += `\t\treturn -1;\n`;
    code += `\t}\n`;
    code += `\tLOG_INF("USB device initialized");\n\n`;
  }

  if (moduleIds.has('settings')) {
    code += `\tint ret_settings = settings_subsys_init();\n`;
    code += `\tif (ret_settings) {\n`;
    code += `\t\tLOG_WRN("Settings subsys init failed: %d", ret_settings);\n`;
    code += `\t}\n\n`;
  }

  if (moduleIds.has('bluetooth')) {
    code += `\tint err_bt = bt_enable(NULL);\n`;
    code += `\tif (err_bt) {\n`;
    code += `\t\tLOG_ERR("Bluetooth init failed (err %d)", err_bt);\n`;
    code += `\t\treturn -1;\n`;
    code += `\t}\n`;
    code += `\tLOG_INF("Bluetooth LE stack initialized");\n\n`;
  }

  if (hasGpio && config.templateId === 'blinky') {
    code += `\tint ret;\n`;
    code += `\tif (!gpio_is_ready_dt(&led)) {\n`;
    code += `\t\tLOG_ERR("Error: LED device %s is not ready", led.port->name);\n`;
    code += `\t\treturn 0;\n`;
    code += `\t}\n\n`;
    code += `\tret = gpio_pin_configure_dt(&led, GPIO_OUTPUT_ACTIVE);\n`;
    code += `\tif (ret < 0) {\n`;
    code += `\t\tLOG_ERR("Error %d: failed to configure LED pin", ret);\n`;
    code += `\t\treturn 0;\n`;
    code += `\t}\n\n`;
    code += `\tLOG_INF("Blinky started, toggling LED every %d ms", SLEEP_TIME_MS);\n\n`;
  }

  code += `\tuint32_t count = 0;\n`;
  code += `\twhile (1) {\n`;

  if (hasGpio && config.templateId === 'blinky') {
    code += `\t\tgpio_pin_toggle_dt(&led);\n`;
  }

  if (moduleIds.has('logging')) {
    code += `\t\tLOG_INF("Heartbeat cycle %u (uptime: %lld ms)", ++count, k_uptime_get());\n`;
  } else {
    code += `\t\tprintk("Heartbeat cycle %u (uptime: %lld ms)\\n", ++count, k_uptime_get());\n`;
  }

  code += `\t\tk_sleep(K_MSEC(1000));\n`;
  code += `\t}\n\n`;
  code += `\treturn 0;\n`;
  code += `}\n`;

  return code;
}

export function generateMainCpp(config: ProjectConfig, modules: Module[], board?: Board): string {
  const moduleIds = new Set(modules.map((m) => m.id));
  const boardId = board ? board.id : config.boardId;
  const boardName = board ? board.name : config.boardId;

  const includes = new Set<string>(['<zephyr/kernel.h>']);

  if (moduleIds.has('logging')) {
    includes.add('<zephyr/logging/log.h>');
  }
  if (moduleIds.has('console')) {
    includes.add('<zephyr/sys/printk.h>');
  }
  if (moduleIds.has('gpio')) {
    includes.add('<zephyr/drivers/gpio.h>');
  }
  if (moduleIds.has('bluetooth')) {
    includes.add('<zephyr/bluetooth/bluetooth.h>');
    includes.add('<zephyr/bluetooth/gatt.h>');
  }
  if (moduleIds.has('sensor')) {
    includes.add('<zephyr/drivers/sensor.h>');
  }
  if (moduleIds.has('shell')) {
    includes.add('<zephyr/shell/shell.h>');
  }
  if (moduleIds.has('usb_device') || moduleIds.has('usb_cdc_acm')) {
    includes.add('<zephyr/usb/usb_device.h>');
  }

  let code = `/*
 * ${config.name} (C++)
 * Generated by Zephyr-Startr for ${boardName} (${boardId})
 * SPDX-License-Identifier: Apache-2.0
 */

`;

  for (const inc of Array.from(includes).sort()) {
    code += `#include ${inc}\n`;
  }
  code += '\n';

  if (moduleIds.has('logging')) {
    code += `LOG_MODULE_REGISTER(app, LOG_LEVEL_INF);\n\n`;
  }

  const hasGpio = moduleIds.has('gpio');
  if (hasGpio && config.templateId === 'blinky') {
    code += `/* 1000 msec = 1 sec */
#define SLEEP_TIME_MS 1000

/* The devicetree node identifier for the "led0" alias. */
#define LED0_NODE DT_ALIAS(led0)

#if DT_NODE_HAS_STATUS(LED0_NODE, okay)
static const struct gpio_dt_spec led = GPIO_DT_SPEC_GET(LED0_NODE, gpios);
#else
#error "Unsupported board: led0 devicetree alias is not defined"
#endif

`;
  }

  code += `class HeartbeatApp {\npublic:\n`;
  code += `\texplicit HeartbeatApp(const char *appName)\n\t\t: app_name_(appName), cycle_count_(0) {}\n\n`;
  code += `\tvoid initialize() {\n`;

  if (moduleIds.has('logging')) {
    code += `\t\tLOG_INF("========================================");\n`;
    code += `\t\tLOG_INF("Starting %s (C++17)", app_name_);\n`;
    code += `\t\tLOG_INF("Board: ${boardName} (${boardId})");\n`;
    code += `\t\tLOG_INF("Zephyr Version: ${config.zephyrVersion}");\n`;
    code += `\t\tLOG_INF("========================================");\n\n`;
  } else {
    code += `\t\tprintk("========================================\\n");\n`;
    code += `\t\tprintk("Starting %s (C++17)\\n", app_name_);\n`;
    code += `\t\tprintk("Board: ${boardName} (${boardId})\\n");\n`;
    code += `\t\tprintk("========================================\\n\\n");\n`;
  }

  if (moduleIds.has('usb_device') || moduleIds.has('usb_cdc_acm')) {
    code += `\t\tif (usb_enable(NULL)) {\n`;
    code += `\t\t\tLOG_ERR("Failed to enable USB device");\n`;
    code += `\t\t} else {\n`;
    code += `\t\t\tLOG_INF("USB device initialized");\n`;
    code += `\t\t}\n\n`;
  }

  if (moduleIds.has('bluetooth')) {
    code += `\t\tint err = bt_enable(NULL);\n`;
    code += `\t\tif (err) {\n`;
    code += `\t\t\tLOG_ERR("Bluetooth init failed (err %d)", err);\n`;
    code += `\t\t} else {\n`;
    code += `\t\t\tLOG_INF("Bluetooth LE stack initialized");\n`;
    code += `\t\t}\n\n`;
  }

  if (hasGpio && config.templateId === 'blinky') {
    code += `\t\tif (!gpio_is_ready_dt(&led)) {\n`;
    code += `\t\t\tLOG_ERR("Error: LED device is not ready");\n`;
    code += `\t\t} else {\n`;
    code += `\t\t\tgpio_pin_configure_dt(&led, GPIO_OUTPUT_ACTIVE);\n`;
    code += `\t\t\tLOG_INF("Blinky started (C++), toggling every %d ms", SLEEP_TIME_MS);\n`;
    code += `\t\t}\n\n`;
  }

  code += `\t}\n\n`;
  code += `\tvoid tick() {\n`;
  code += `\t\t++cycle_count_;\n`;

  if (hasGpio && config.templateId === 'blinky') {
    code += `\t\tgpio_pin_toggle_dt(&led);\n`;
  }

  if (moduleIds.has('logging')) {
    code += `\t\tLOG_INF("Heartbeat cycle %u (uptime: %lld ms)", cycle_count_, k_uptime_get());\n`;
  } else {
    code += `\t\tprintk("Heartbeat cycle %u (uptime: %lld ms)\\n", cycle_count_, k_uptime_get());\n`;
  }

  code += `\t}\n\n`;
  code += `private:\n\tconst char *app_name_;\n\tuint32_t cycle_count_;\n};\n\n`;
  code += `int main(void)\n{\n\tHeartbeatApp app("${config.name}");\n\tapp.initialize();\n\n\twhile (1) {\n\t\tapp.tick();\n\t\tk_sleep(K_MSEC(1000));\n\t}\n\n\treturn 0;\n}\n`;

  return code;
}

export function generateCargoToml(config: ProjectConfig): string {
  const safeName = config.name.replace(/[^a-zA-Z0-9_]/g, '_');
  return `[package]
name = "${safeName}"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["staticlib"]

[dependencies]
# zephyr = "0.1.0"
`;
}

export function generateLibRs(config: ProjectConfig, board?: Board): string {
  const boardId = board ? board.id : config.boardId;
  const boardName = board ? board.name : config.boardId;

  return `//! ${config.name} (Rust)
//! Generated by Zephyr-Startr for ${boardName} (${boardId})
//! SPDX-License-Identifier: Apache-2.0

#![no_std]

use core::panic::PanicInfo;

/// Application entry point invoked by Zephyr RTOS C runtime startup
#[no_mangle]
pub extern "C" fn rust_main() {
    let mut count: u32 = 0;

    // Heartbeat loop
    loop {
        count = count.wrapping_add(1);
        // Note: Call Zephyr kernel C functions via FFI bindings or the zephyr crate.
    }
}

/// Panic handler for bare-metal no_std execution
#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {}
}
`;
}

export function generateSampleYaml(config: ProjectConfig, board?: Board): string {
  const boardId = board ? board.id : config.boardId;
  return `sample:
  name: ${config.name}
  description: Generated Zephyr-Startr application
common:
  tags: zephyr-startr
tests:
  sample.basic:
    platform_allow:
      - ${boardId}
    integration_platforms:
      - ${boardId}
`;
}

export function generateGitignore(): string {
  return `# Zephyr build outputs
build/
twister-out*/
.west/
compile_commands.json
*.bin
*.elf
*.hex
*.uf2

# Zephyr West dependencies (managed by west update)
zephyr/
modules/
tools/
bootloader/

# Python virtual environment (at workspace root)
.venv/
__pycache__/

# IDE & Editor artifacts
.vscode/
.idea/
*.swp
*.bak
`;
}

export function generateReadmeMd(config: ProjectConfig, modules: Module[], board?: Board): string {
  const inferred = inferBoardDetails(config.boardId);
  const boardName = board ? board.name : inferred.name;
  const boardId = board ? board.id : config.boardId;
  const vendor = board ? board.vendor : (inferred.vendorKey !== 'unknown' ? inferred.vendorKey.toUpperCase() : 'Generic');
  const arch = board ? board.arch : inferred.arch;
  const isStandalone = config.workspaceType !== 'application';
  const lang = config.language || 'c';

  const langLabel = lang === 'cpp' ? 'C++ (C++17)' : (lang === 'rust' ? 'Rust' : 'C (C99/C11)');
  const mainSourceFile = lang === 'cpp' ? 'main.cpp' : (lang === 'rust' ? 'src/lib.rs' : 'main.c');

  let modsTable = '| Module | Category | Required West Projects | Description |\n|---|---|---|---|\n';
  if (modules.length > 0) {
    for (const m of modules) {
      const west = m.westModules && m.westModules.length > 0 ? `\`${m.westModules.join(', ')}\`` : '*(none)*';
      modsTable += `| **${m.name}** | \`${m.category}\` | ${west} | ${m.description} |\n`;
    }
  } else {
    modsTable += '| *(none)* | `Core` | *(none)* | Minimal application |\n';
  }

  const langSection = lang === 'cpp'
    ? `### Programming Language: Modern C++
This project is configured for **Modern C++ (C++17)** development with Zephyr RTOS:
- Source entry point: \`${isStandalone ? 'app/' : ''}src/main.cpp\`
- Kconfig options: \`CONFIG_CPP=y\`, \`CONFIG_STD_CPP17=y\`, \`CONFIG_REQUIRES_FULL_LIBCPP=y\`
- The Zephyr toolchain automatically links C++ runtime support and standard libraries (\`libc++\` / \`libstdc++\`).
`
    : (lang === 'rust'
      ? `### Programming Language: Embedded Rust
This project is configured for **Embedded Rust** development integrated with Zephyr RTOS:
- Source entry point: \`${isStandalone ? 'app/' : ''}src/lib.rs\`
- Manifest: \`${isStandalone ? 'app/' : ''}Cargo.toml\`
- Kconfig option: \`CONFIG_RUST=y\`
- Before building, ensure the appropriate bare-metal Rust target is installed via \`rustup\`:
  \`\`\`bash
  # For ARM Cortex-M:
  rustup target add thumbv7m-none-eabi  # or thumbv7em-none-eabi / thumbv8m.main-none-eabi
  \`\`\`
`
      : `### Programming Language: C
This project is configured for standard **C (C99/C11)** embedded development:
- Source entry point: \`${isStandalone ? 'app/' : ''}src/main.c\`
`);

  if (isStandalone) {
    const fileTree = lang === 'rust'
      ? `${config.name}/
├── .venv/            # Python virtual environment at workspace root
├── .gitignore        # Git ignore rules (ignores .venv, build, zephyr, modules)
├── README.md         # This workspace guide
└── app/              # Application manifest repository
    ├── west.yml      # West manifest with full upstream allowlist
    ├── CMakeLists.txt# CMake application build script (rust_cargo_application)
    ├── Cargo.toml    # Cargo staticlib manifest
    ├── prj.conf      # Kconfig project settings (CONFIG_RUST=y)
    ├── sample.yaml   # Twister automated test metadata
    └── src/
        └── lib.rs    # Rust entry point (rust_main)`
      : `${config.name}/
├── .venv/            # Python virtual environment at workspace root
├── .gitignore        # Git ignore rules (ignores .venv, build, zephyr, modules)
├── README.md         # This workspace guide
└── app/              # Application manifest repository
    ├── west.yml      # West manifest with full upstream allowlist
    ├── CMakeLists.txt# CMake application build script
    ├── prj.conf      # Kconfig project settings
    ├── sample.yaml   # Twister automated test metadata
    └── src/
        └── ${mainSourceFile}    # Application entry point with initialized subsystems`;

    return `# ${config.name}

Zephyr RTOS dedicated workspace configured for **${boardName}** (\`${boardId}\`).

| Target Board | Architecture | Vendor | Language | Zephyr Revision | Packaging |
|:---|:---|:---|:---|:---|:---|
| **${boardName}** (\`${boardId}\`) | \`${arch.toUpperCase()}\` | ${vendor} | \`${langLabel}\` | \`${config.zephyrVersion || 'main'}\` | **Dedicated Workspace** |

> Generated on the fly by **[Zephyr-Startr](https://start.zephyrproject.io)** — Fast project generator for Zephyr RTOS.

---

## Quick Start Guide

This project is packaged as a **dedicated Zephyr workspace**. It contains a local application repository (\`app/\`) with its own allowlisted West manifest (\`app/west.yml\`).

### 1. Host System Preparation (Prerequisites)

Follow the official [Zephyr Getting Started Guide](https://docs.zephyrproject.org/latest/develop/getting_started/index.html) to prepare your host system.

#### macOS (Apple Silicon & Intel)
1. Install [Homebrew](https://brew.sh/) if not already installed.
2. Install host tools and build dependencies via Homebrew:
   \`\`\`bash
   brew install cmake ninja gperf python3 ccache qemu dtc wget libmagic
   \`\`\`
3. Install the Zephyr SDK:
   \`\`\`bash
   brew install zephyr-sdk
   \`\`\`
   *(Alternatively, download and run the setup script from the [Zephyr SDK Releases](https://github.com/zephyrproject-rtos/sdk-ng/releases).)*

#### Ubuntu / Debian Linux
1. Update package lists and install host build tools:
   \`\`\`bash
   sudo apt update && sudo apt install --no-install-recommends -y \\
     git cmake ninja-build gperf \\
     ccache dfu-util device-tree-compiler wget \\
     python3-dev python3-pip python3-setuptools python3-tk python3-wheel xz-utils file \\
     make gcc gcc-multilib g++-multilib libsdl2-dev libmagic1
   \`\`\`
2. Download and install the [Zephyr SDK](https://docs.zephyrproject.org/latest/develop/getting_started/index.html#install-the-zephyr-sdk).

#### Windows
Use Windows Subsystem for Linux (WSL2 Ubuntu) following the Linux instructions above, or refer to the native [Zephyr Windows Guide](https://docs.zephyrproject.org/latest/develop/getting_started/index.html) using Chocolatey.

---

### 2. Python Virtual Environment Setup

Set up a Python virtual environment in the \`.venv\` folder located directly at the root of this Zephyr workspace:

\`\`\`bash
# 1. Navigate to the extracted workspace folder:
cd ${config.name}

# 2. Create the .venv folder directly at the workspace root:
python3 -m venv .venv

# 3. Activate the virtual environment:
# On macOS / Linux:
source .venv/bin/activate
# On Windows (PowerShell):
.venv\\Scripts\\Activate.ps1
# On Windows (cmd.exe):
.venv\\Scripts\\activate.bat

# 4. Upgrade pip and install West inside the virtual environment:
pip install --upgrade pip
pip install west
\`\`\`

---

### 3. Initialize the West Workspace

With your virtual environment active (\`source .venv/bin/activate\`), initialize West using the local \`app\` directory as the manifest repository and perform shallow copies with \`west update -n\`:

\`\`\`bash
# 1. Initialize West pointing to local app/ manifest:
west init -l app

# 2. Clone Zephyr repository and strictly required HAL / modules (shallow copy):
west update -n

# 3. Export Zephyr CMake package:
west zephyr-export

# 4. Install Zephyr Python requirements into .venv:
pip install -r zephyr/scripts/requirements.txt
\`\`\`

> **Shallow Repository Clones (\`west update -n\`):**
> Passing \`-n\` (\`--narrow\`) makes shallow copies of the upstream repositories without cloning full commit histories, cutting download size by several gigabytes and drastically speeding up workspace synchronization.

---

### 4. Build the Application

Ensure your Python virtual environment is active (\`source .venv/bin/activate\`), then compile the application from the workspace root:

\`\`\`bash
# Build for ${boardName}:
west build -b ${boardId} app

# Tip: Run a pristine build if rebuilding or switching configurations:
west build -p auto -b ${boardId} app
\`\`\`

---

${langSection}

---

### 5. Flash to Hardware

Connect your board to your computer via USB or debug probe, then execute:

\`\`\`bash
west flash
\`\`\`

West automatically detects and invokes the appropriate flashing runner configured for \`${boardId}\` (e.g. OpenOCD, J-Link, pyOCD, esptool, dfu-util, or UF2).

---

### 6. Serial Console Monitoring

Connect a serial terminal emulator at **115200 baud** to view logs and diagnostic printk output:

#### macOS:
\`\`\`bash
# Connect using screen (or tio / picocom):
screen /dev/cu.usbmodem* 115200
# (To exit screen: press Ctrl+A, then press k, then press y)
\`\`\`

#### Linux:
\`\`\`bash
picocom -b 115200 /dev/ttyACM0
\`\`\`

---

## Enabled Modules & Subsystems

${modsTable}

---

## Workspace Structure

\`\`\`
${fileTree}
\`\`\`
`;
  }

  // Application Only mode
  const appFileTree = lang === 'rust'
    ? `${config.name}/
├── CMakeLists.txt   # CMake application configuration (rust_cargo_application)
├── Cargo.toml       # Cargo staticlib manifest
├── prj.conf         # Kconfig project settings (CONFIG_RUST=y)
├── sample.yaml      # Twister automated test metadata
├── README.md        # Getting started guide
├── .gitignore       # Git ignore rules
└── src/
    └── lib.rs       # Rust entry point (rust_main)`
    : `${config.name}/
├── CMakeLists.txt   # CMake application configuration
├── prj.conf         # Kconfig project settings
├── sample.yaml      # Twister automated test metadata
├── README.md        # Getting started guide
├── .gitignore       # Git ignore rules
└── src/
    └── ${mainSourceFile}       # Application entry point with initialized subsystems`;

  return `# ${config.name}

Zephyr RTOS application configured for **${boardName}** (\`${boardId}\`).

| Target Board | Architecture | Vendor | Language | Zephyr Revision | Packaging |
|:---|:---|:---|:---|:---|:---|
| **${boardName}** (\`${boardId}\`) | \`${arch.toUpperCase()}\` | ${vendor} | \`${langLabel}\` | \`${config.zephyrVersion || 'main'}\` | **Application Only (Existing Workspace)** |

> Generated on the fly by **[Zephyr-Startr](https://start.zephyrproject.io)** — Fast project generator for Zephyr RTOS.

---

## Quick Start Guide

This project is packaged as an **application folder** designed to be added directly into your existing Zephyr workspace.

### 1. Add to Existing Zephyr Workspace

Extract or copy this application folder into the root of your existing Zephyr workspace (the directory containing \`zephyr/\` and your workspace \`.venv\`):

\`\`\`bash
# 1. Copy the application folder into your existing Zephyr workspace:
cp -r ${config.name} /path/to/your/zephyr-workspace/

# 2. Navigate to your Zephyr workspace root:
cd /path/to/your/zephyr-workspace/
\`\`\`

---

### 2. Activate Workspace Virtual Environment & Sync

Activate the Python virtual environment located in the \`.venv\` folder at the root of your Zephyr workspace:

\`\`\`bash
# On macOS / Linux:
source .venv/bin/activate
# On Windows (PowerShell):
.venv\\Scripts\\Activate.ps1
# On Windows (cmd.exe):
.venv\\Scripts\\activate.bat

# If additional modules or dependencies are needed, update with shallow clones:
west update -n
\`\`\`

---

### 3. Build the Application

From the root of your Zephyr workspace, compile the application targeting **${boardName}**:

\`\`\`bash
# Build the application:
west build -b ${boardId} ${config.name}

# Tip: Run a pristine build if rebuilding or switching configurations:
west build -p auto -b ${boardId} ${config.name}
\`\`\`

---

${langSection}

---

### 4. Flash to Hardware

Connect your board to your computer via USB or debug probe, then execute:

\`\`\`bash
west flash
\`\`\`

West automatically invokes the appropriate runner configured for \`${boardId}\` (e.g. OpenOCD, J-Link, pyOCD, esptool, dfu-util, or UF2).

---

### 5. Serial Console Monitoring

Connect a serial terminal emulator at **115200 baud** to view logs and diagnostic printk output:

#### macOS:
\`\`\`bash
screen /dev/cu.usbmodem* 115200
\`\`\`

#### Linux:
\`\`\`bash
picocom -b 115200 /dev/ttyACM0
\`\`\`

---

## Enabled Modules & Subsystems

${modsTable}

---

## Project Structure

\`\`\`
${appFileTree}
\`\`\`
`;
}

export function generateAllFiles(config: ProjectConfig, modules: Module[], board?: Board): GeneratedFile[] {
  const isStandalone = config.workspaceType !== 'application';
  const lang = config.language || 'c';
  const prefix = isStandalone ? 'app/' : '';

  const files: GeneratedFile[] = [
    {
      path: 'README.md',
      name: 'README.md',
      content: generateReadmeMd(config, modules, board),
      language: 'markdown',
    },
    {
      path: '.gitignore',
      name: '.gitignore',
      content: generateGitignore(),
      language: 'text',
    },
  ];

  if (isStandalone) {
    files.push({
      path: 'app/west.yml',
      name: 'west.yml',
      content: generateWestManifest(config, modules, board),
      language: 'yaml',
    });
  }

  files.push({
    path: `${prefix}CMakeLists.txt`,
    name: 'CMakeLists.txt',
    content: generateCMakeLists(config),
    language: 'cmake',
  });

  files.push({
    path: `${prefix}prj.conf`,
    name: 'prj.conf',
    content: generatePrjConf(config, modules),
    language: 'ini',
  });

  if (lang === 'rust') {
    files.push({
      path: `${prefix}Cargo.toml`,
      name: 'Cargo.toml',
      content: generateCargoToml(config),
      language: 'toml',
    });
    files.push({
      path: `${prefix}src/lib.rs`,
      name: 'lib.rs',
      content: generateLibRs(config, board),
      language: 'rust',
    });
  } else if (lang === 'cpp') {
    files.push({
      path: `${prefix}src/main.cpp`,
      name: 'main.cpp',
      content: generateMainCpp(config, modules, board),
      language: 'cpp',
    });
  } else {
    files.push({
      path: `${prefix}src/main.c`,
      name: 'main.c',
      content: generateMainC(config, modules, board),
      language: 'c',
    });
  }

  files.push({
    path: `${prefix}sample.yaml`,
    name: 'sample.yaml',
    content: generateSampleYaml(config, board),
    language: 'yaml',
  });

  return files;
}

export async function downloadProjectZip(config: ProjectConfig, modules: Module[], board?: Board): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder(config.name) || zip;

  const files = generateAllFiles(config, modules, board);
  for (const f of files) {
    folder.file(f.path, f.content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${config.name}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
