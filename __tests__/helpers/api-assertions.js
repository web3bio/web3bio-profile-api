import { queryClient } from "../../utils/test-utils";

export const requestJson = async (path, headers, baseUrl) => {
  const res = await queryClient(path, headers, baseUrl);
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
}, headers, baseUrl) => {
  const { res, json } = await requestJson(path, headers, baseUrl);
  expect(res.status).toBe(expectedStatus);
  if (assertJson) {
    await assertJson(json, res);
  }
  return { res, json };
};

export const expectPaidJsonCase = async (testCase) => {
  const { PAID_TEST_BASE_URL: local, PAID_TEST_API_KEY: key } = process.env;
  if (!local) return expectJsonCase(testCase);

  await expectJsonCase({
    path: testCase.path,
    expectedStatus: 403,
    assertJson: (json, res) => {
      expect(res.headers.get("X-Quota-Remaining")).toBe("0");
      expect(json.message).toBe("API key required");
    },
  }, { "x-api-key": process.env.ZERO_BALANCE_TEST_API_KEY });
  const result = await expectJsonCase(testCase, { "x-api-key": key }, local);
  expect(result.res.headers.get("X-Quota-Remaining")).toMatch(/^\d+$/);
  return result;
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
