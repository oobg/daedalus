import assert from "node:assert/strict";
import test from "node:test";

import {
  applyContactShadowActivation,
  getContactShadowActivationPreset,
  resolveContactShadowActivationSettings,
} from "../src/features/viewer/index.ts";

test("contact shadow preset targets the localized architectural layers on desktop-class devices", () => {
  const preset = getContactShadowActivationPreset("miniatureArchitecture");

  assert.deepEqual(preset, {
    enabled: true,
    blur: 2.8,
    color: "#B9AA96",
    opacity: 0.34,
    far: 1.85,
    resolution: 1024,
    elements: ["floor", "furniture", "wall"],
  });
  assert.ok(Object.isFrozen(preset));
  assert.ok(Object.isFrozen(preset.elements));
});

test("contact shadow activation applies the enabled desktop state without mutating the preset", () => {
  const preset = getContactShadowActivationPreset("miniatureArchitecture");
  const activated = applyContactShadowActivation(preset, true);

  assert.equal(activated, preset);
  assert.deepEqual(activated.elements, ["floor", "furniture", "wall"]);
});

test("contact shadow activation disables localized shadows on compact touch hardware", () => {
  const resolved = resolveContactShadowActivationSettings({
    viewportWidth: 768,
    devicePixelRatio: 3,
    hardwareConcurrency: 4,
    maxTouchPoints: 5,
  });

  assert.deepEqual(resolved, {
    enabled: false,
    blur: 0,
    color: "#000000",
    opacity: 0,
    far: 0,
    resolution: 0,
    elements: [],
  });
});

test("contact shadow activation can explicitly disable an otherwise enabled preset", () => {
  const preset = getContactShadowActivationPreset("miniatureArchitecture");
  const disabled = applyContactShadowActivation(preset, false);

  assert.equal(disabled.enabled, false);
  assert.equal(disabled.opacity, 0);
  assert.deepEqual(disabled.elements, []);
  assert.ok(Object.isFrozen(disabled));
  assert.ok(Object.isFrozen(disabled.elements));
});
