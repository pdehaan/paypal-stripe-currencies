import CachedFetch from "@11ty/eleventy-fetch";
import * as cheerio from "cheerio";
import cc from "currency-codes";

export const providers = {
  PAYPAL: "paypal",
  STRIPE: "stripe",
};

export async function fetchStripeCurrencies() {
  const res = await CachedFetch(
    "https://stripe.com/docs/currencies?presentment-currency=US",
    {
      type: "text",
      duration: "1d",
    }
  );
  const $ = cheerio.load(res);

  const threeDecimalCurrencies = $("h2#three-decimal ~ ul.List li")
    .map((i, el) => $(el).text().trim())
    .get();

  const currencies = $(
    "h2#presentment-currencies ~ div.TabGroup ul.List--hasMultipleColumns li"
  )
    .map((i, el) => {
      const code = $(el).text().replace("*", "").trim();
      return {
        code,
      };
    })
    .get();

  for (const code of threeDecimalCurrencies) {
    currencies.push({
      code,
    });
  }

  return currencies.reduce((acc, obj) => {
    const data = sanitizeCurrency(obj, providers.STRIPE);
    acc.push(data);
    return acc;
  }, []);
}

export async function fetchPayPalCurrencies() {
  const res = await CachedFetch(
    "https://developer.paypal.com/docs/reports/reference/paypal-supported-currencies/",
    {
      type: "text",
      duration: "1d",
    }
  );
  const $ = cheerio.load(res);
  const currencies = $("main table tbody tr")
    .map(function () {
      const [currency, code] = $(this).find("td");
      return {
        currency: $(currency).text().trim(),
        code: $(code).text().trim(),
      };
    })
    .get();

  return currencies.reduce((acc, obj) => {
    const data = sanitizeCurrency(obj, providers.PAYPAL);
    acc.push(data);
    return acc;
  }, []);
}

export function sanitizeCurrency(obj, provider = "") {
  if (!Array.isArray(provider)) {
    provider = [provider];
  }
  const details = cc.code(obj.code) || {};
  return Object.assign(obj, details, { provider });
}
