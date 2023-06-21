#!/usr/bin/env node

import { fetchPayPalCurrencies, fetchStripeCurrencies, providers } from "./lib.js";

let currencies = await getCurrencies();
if (process.argv.includes("--both")) {
  currencies = currencies.filter((a) => a?.provider.includes(providers.PAYPAL) && a?.provider.includes(providers.STRIPE));
}

if (process.argv.includes("--markdown")) {
  console.log(`CURRENCY | DIGITS | PAYPAL / STRIPE\n----|:----:|:----:`);
  for (const c of currencies) {
    const p = c.provider ?? [];
    console.log(`[${c.code}] ${c.currency ?? "?"} | ${c.digits ?? "?"} | ${trueFalse(p.includes(providers.PAYPAL))} / ${trueFalse(p.includes(providers.STRIPE))}`);
  }
} else {
  console.log(JSON.stringify(currencies, null, 2));
}

async function getCurrencies() {
  const _providers = await Promise.all([
    fetchStripeCurrencies(),
    fetchPayPalCurrencies(),
  ]);

  const merged = {};
  for (const curr of _providers.flat()) {
    if (curr.code in merged) {
      const data = merged[curr.code];
      data.provider = data.provider.concat(curr.provider).sort();
      merged[curr.code] = data;
    } else {
      merged[curr.code] = curr;
    }
  }

  const currencies = Object.values(merged)
    .map(c => {
      const {
        number,
        // countries,
        ...rest
      } = c;
      return rest;
    })
    .sort((a, b) => a.code.localeCompare(b.code));
  return currencies;
}

function trueFalse(value) {
  return (value) ? "✓" : "✗";
}
