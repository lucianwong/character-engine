import {
  CharacterController,
  NullRendererAdapter,
  PARAM,
  createMinimalCharacterPack,
} from "../src";

async function main(): Promise<void> {
  const renderer = new NullRendererAdapter();
  const controller = new CharacterController(
    createMinimalCharacterPack(),
    renderer,
  );

  await controller.load();

  await controller.tick(0);

  controller.dispatch({ name: "listen" });
  controller.setGaze(0.45, -0.15);
  await controller.tick(200);

  controller.dispatch({ name: "talk" });
  controller.setLipSync({
    a: 0.8,
    e: 0.05,
    i: 0.05,
    o: 0.1,
    u: 0,
  });
  await controller.tick(400);

  controller.dispatch({ name: "wave", intensity: 0.9 });
  const frame = await controller.tick(700);

  console.log("renderer:", renderer.id);
  console.log("state:", controller.stateMachine.state);
  console.log("left arm:", frame[PARAM.armL].toFixed(3));
  console.log("mouth:", frame[PARAM.mouthOpenY].toFixed(3));
  console.log("gaze x:", frame[PARAM.eyeBallX].toFixed(3));

  await controller.unload();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
