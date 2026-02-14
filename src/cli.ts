#!/usr/bin/env bun
/* eslint-disable no-console */

import { main } from "./cli/main";

await main(process.argv.slice(2));
