"use client";

import { useState } from "react";
import { useDash } from "../Shell";
import {
  BulletList, ErrorNote, FieldLabel, ResultHeading, RunButton, TextInput, ToolCard, ToolShell, useAiTool,
} from "./bits";
import { formatInr, type InHandBreakdown } from "@/lib/ai/salary";
import type { SalaryResult } from "@/app/api/ai/salary/route";

function lpa(n: number): string {
  return `₹${n % 1 === 0 ? n : n.toFixed(1)} LPA`;
}

function RangePoint({ label, lpaValue, breakdown, highlight }: { label: string; lpaValue: number; breakdown: InHandBreakdown; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 text-center ${highlight ? "border-brand bg-brand-tonal" : "border-line"}`}>
      <p className="text-[11.5px] font-extrabold uppercase tracking-wide text-ink-3">{label}</p>
      <p className="text-[20px] font-extrabold mt-1">{lpa(lpaValue)}</p>
      <p className="text-[12.5px] text-ink-2 mt-1">≈ <span className="font-extrabold text-ink">{formatInr(breakdown.monthlyInHand)}</span>/mo in hand</p>
    </div>
  );
}

export default function SalaryEstimator() {
  const { profile } = useDash();
  const [role, setRole] = useState(profile.headline ?? "");
  const [city, setCity] = useState(profile.location ?? "");
  const [years, setYears] = useState("");
  const [skills, setSkills] = useState(profile.skills?.join(", ") ?? "");
  const [currentCtc, setCurrentCtc] = useState("");
  const { run, loading, error, data } = useAiTool<SalaryResult>("salary");

  return (
    <ToolShell icon="💰" title="AI Salary Estimator" subtitle="Realistic CTC ranges for your role and city — with what actually lands in your account each month.">
      <ToolCard>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (role.trim() && city.trim()) {
              run({ role, city, yearsExperience: Number(years) || 0, skills, currentCtcLpa: Number(currentCtc) || undefined });
            }
          }}
          className="grid gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Role</FieldLabel>
              <TextInput required value={role} onChange={(e) => setRole(e.target.value)} maxLength={200} placeholder="e.g. Accounts Executive" />
            </div>
            <div>
              <FieldLabel>City</FieldLabel>
              <TextInput required value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} placeholder="e.g. Pune" />
            </div>
            <div>
              <FieldLabel>Years of experience</FieldLabel>
              <TextInput type="number" min={0} max={50} value={years} onChange={(e) => setYears(e.target.value)} placeholder="e.g. 3" />
            </div>
            <div>
              <FieldLabel hint="optional — helps anchor a realistic hike">Current CTC (LPA)</FieldLabel>
              <TextInput type="number" min={0} step="0.1" value={currentCtc} onChange={(e) => setCurrentCtc(e.target.value)} placeholder="e.g. 4.5" />
            </div>
          </div>
          <div>
            <FieldLabel hint="optional">Key skills</FieldLabel>
            <TextInput value={skills} onChange={(e) => setSkills(e.target.value)} maxLength={500} placeholder="e.g. Tally, GST filing, MS Excel" />
          </div>
          <div>
            <RunButton loading={loading} disabled={!role.trim() || !city.trim()}>Estimate my salary</RunButton>
          </div>
        </form>
      </ToolCard>

      <ErrorNote error={error} />

      {data && (
        <>
          <ToolCard>
            <ResultHeading>Market range — {role || "your role"}</ResultHeading>
            <p className="text-[13.5px] text-ink-2 mt-1 leading-relaxed">{data.summary}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <RangePoint label="Conservative" lpaValue={data.minLpa} breakdown={data.inHand.min} />
              <RangePoint label="Typical" lpaValue={data.medianLpa} breakdown={data.inHand.median} highlight />
              <RangePoint label="Strong offer" lpaValue={data.maxLpa} breakdown={data.inHand.max} />
            </div>
          </ToolCard>

          <ToolCard>
            <ResultHeading>CTC → in-hand at {lpa(data.medianLpa)}</ResultHeading>
            <div className="mt-3 grid gap-2 text-[13.5px]">
              {[
                ["Monthly gross (after employer PF & gratuity)", formatInr(data.inHand.median.monthlyGross)],
                ["Your PF contribution (yearly)", `− ${formatInr(data.inHand.median.employeePf)}`],
                ["Income tax, new regime (yearly)", `− ${formatInr(data.inHand.median.incomeTax)}`],
                ["Professional tax (yearly)", `− ${formatInr(data.inHand.median.professionalTax)}`],
                ["Monthly in-hand", formatInr(data.inHand.median.monthlyInHand)],
              ].map(([label, value], i, arr) => (
                <div key={label} className={`flex items-center justify-between gap-4 py-1.5 ${i === arr.length - 1 ? "border-t border-line pt-3 font-extrabold" : ""}`}>
                  <span className={i === arr.length - 1 ? "" : "text-ink-2"}>{label}</span>
                  <span className="font-bold">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-[11.5px] text-ink-3 mt-3 leading-relaxed">
              Estimate assumes basic = 40% of CTC, PF on basic, new tax regime with standard deduction. Actual take-home depends on your company&apos;s salary structure.
            </p>
          </ToolCard>

          <div className="grid gap-4 md:grid-cols-2">
            <ToolCard>
              <ResultHeading>What moves your number</ResultHeading>
              <div className="mt-3"><BulletList items={data.factors} /></div>
            </ToolCard>
            <ToolCard>
              <ResultHeading>Negotiation tips</ResultHeading>
              <div className="mt-3"><BulletList items={data.negotiationTips} tone="good" /></div>
            </ToolCard>
          </div>
        </>
      )}
    </ToolShell>
  );
}
