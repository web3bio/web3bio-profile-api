import { queryClient } from "../../utils/test-utils";

export const requestJson = async (path) => {
  const res = await queryClient(path);
  const json = await res.json();
  return { res, json };
};

export const requestText = async (path) => {
  const res = await queryClient(path);
  const text = await res.text();
  return { res, text };
};

export const expectJsonCase = async ({
  path,
  expectedStatus = 200,
  assertJson,
}) => {
  const { res, json } = await requestJson(path);
  expect(res.status).toBe(expectedStatus);
  if (assertJson) {
    await assertJson(json, res);
  }
  return { res, json };
};

export const expectTextCase = async ({
  path,
  expectedStatus = 200,
  assertText,
}) => {
  const { res, text } = await requestText(path);
  expect(res.status).toBe(expectedStatus);
  if (assertText) {
    await assertText(text, res);
  }
  return { res, text };
};

export const findByPlatform = (json, platform) =>
  json.find((item) => item.platform === platform);
