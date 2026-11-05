import { beforeAll, describe, expect, it } from "vitest";
import * as KozmosVue from "../../src/index";
import { COMPOSABLES, PORTS } from "../ports";
import { EXCEPTIONS } from "./exceptions";
import {
  compareMembers,
  readContract,
  type Finding,
  type PortContract,
} from "./read-contract";

/**
 * Vue 3 Phase 0, P0.4: each Vue part takes what its React part takes — the
 * same props, of the same types, required alike and defaulting alike; an
 * event for each callback and `v-model` for each controlled value; a slot for
 * each node — and nothing React's does not. `read-contract.ts` says how one
 * spells the other. React's side is read from its built declarations, Vue's
 * types from its own, so it holds what ships: build both first (`test`
 * depends on both builds).
 */
let contracts: PortContract[];
let typeFindings: Finding[];
let composableFindings: Finding[];

beforeAll(() => {
  ({ contracts, typeFindings, composableFindings } = readContract(
    KozmosVue as Record<string, unknown>,
  ));
}, 120_000);

const unexcused = (findings: Finding[]) =>
  findings
    .filter((finding) => !(finding.id in EXCEPTIONS))
    .map((f) => f.message);

describe("each Vue part takes what its React part takes", () => {
  for (const port of PORTS)
    it(`${port.vue} answers to React's ${port.react}`, () => {
      const contract = contracts.find((c) => c.port === port)!;
      // The contract read something on both sides: an empty read passes
      // every rule. A part may take only slots.
      expect(contract.react.length).toBeGreaterThan(0);
      expect(
        contract.vueProps.length +
          contract.vueEmits.length +
          (contract.vueSlots?.length ?? 0),
      ).toBeGreaterThan(0);
      const findings = [
        ...compareMembers(contract),
        ...typeFindings.filter((f) => f.id.startsWith(`${port.vue}.`)),
      ];
      expect(unexcused(findings)).toEqual([]);
    });

  for (const pair of COMPOSABLES)
    it(`${pair.vue} returns what React's ${pair.react} returns, as refs`, () => {
      expect(
        unexcused(
          composableFindings.filter((f) => f.id.startsWith(`${pair.vue}:`)),
        ),
      ).toEqual([]);
    });

  it("excuses only findings that still occur", () => {
    const all = [
      ...contracts.flatMap(compareMembers),
      ...typeFindings,
      ...composableFindings,
    ].map((f) => f.id);
    expect(Object.keys(EXCEPTIONS).filter((id) => !all.includes(id))).toEqual(
      [],
    );
    for (const reason of Object.values(EXCEPTIONS))
      expect(reason.trim().length).toBeGreaterThan(20);
  });
});
