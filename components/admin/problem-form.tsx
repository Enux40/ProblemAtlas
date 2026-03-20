"use client";

import {
  BuildTimeUnit,
  MonetizationType,
  ProblemStatus,
  ProjectType,
  SkillLevel,
  SourceType
} from "@prisma/client";
import { useActionState, useEffect, useMemo, useState } from "react";
import type { ProblemFormState } from "@/app/admin/problems/actions";
import { Button } from "@/components/ui/button";
import { formatEnumLabel } from "@/lib/problem-presenters";

type Option = {
  id: string;
  name: string;
  description?: string | null;
};

type EvidenceFormValue = {
  title: string;
  summary: string;
  sourceType: SourceType;
  sourceName: string;
  sourceUrl: string;
  snippet: string;
  signalStrength: string;
  capturedAt: string;
};

export type ProblemFormValues = {
  title: string;
  slug: string;
  tagline: string;
  excerpt: string;
  summary: string;
  description: string;
  targetUser: string;
  painPoint: string;
  suggestedMvp: string;
  demandSignalsSummary: string;
  riskNotes: string;
  category: string;
  industry: string;
  geographyFocus: string;
  companySize: string;
  recommendedSkill: SkillLevel;
  projectTypes: ProjectType[];
  monetizationTypes: MonetizationType[];
  status: ProblemStatus;
  buildTimeValue: number;
  buildTimeUnit: BuildTimeUnit;
  difficultyScore: number;
  demandScore: number;
  monetizationScore: number;
  validationScore: number;
  editorialScore: number;
  featured: boolean;
  tagIds: string[];
  stackIds: string[];
  evidences: EvidenceFormValue[];
};

type ProblemFormProps = {
  action: (
    state: ProblemFormState,
    formData: FormData
  ) => Promise<ProblemFormState>;
  submitLabel: string;
  initialValues: ProblemFormValues;
  tagOptions: Option[];
  stackOptions: Option[];
};

const initialState: ProblemFormState = {};

function getError(state: ProblemFormState, field: string) {
  return state.errors?.[field]?.[0];
}

function getFieldValue(
  state: ProblemFormState,
  initialValues: ProblemFormValues,
  field: keyof ProblemFormValues
) {
  const value = state.fields?.[field];

  if (typeof value === "string") {
    return value;
  }

  const initialValue = initialValues[field];
  return typeof initialValue === "string" || typeof initialValue === "number"
    ? String(initialValue)
    : "";
}

function getSelectedValues(
  state: ProblemFormState,
  initialValues: ProblemFormValues,
  field: "projectTypes" | "monetizationTypes" | "tagIds" | "stackIds"
) {
  const value = state.fields?.[field];

  if (value) {
    return value.split(",").filter(Boolean);
  }

  return initialValues[field];
}

function getEvidenceError(
  state: ProblemFormState,
  index: number,
  field: keyof EvidenceFormValue
) {
  return state.errors?.[`evidences.${index}.${field}`]?.[0];
}

function emptyEvidence(): EvidenceFormValue {
  return {
    title: "",
    summary: "",
    sourceType: SourceType.FORUM,
    sourceName: "",
    sourceUrl: "",
    snippet: "",
    signalStrength: "3",
    capturedAt: ""
  };
}

export function ProblemForm({
  action,
  submitLabel,
  initialValues,
  tagOptions,
  stackOptions
}: ProblemFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const selectedProjectTypes = new Set(
    getSelectedValues(state, initialValues, "projectTypes")
  );
  const selectedMonetizationTypes = new Set(
    getSelectedValues(state, initialValues, "monetizationTypes")
  );
  const selectedTagIds = new Set(getSelectedValues(state, initialValues, "tagIds"));
  const selectedStackIds = new Set(getSelectedValues(state, initialValues, "stackIds"));
  const initialEvidenceValues = useMemo(() => {
    if (state.fields?.evidencesJson) {
      try {
        const parsed = JSON.parse(state.fields.evidencesJson) as EvidenceFormValue[];

        if (Array.isArray(parsed)) {
          return parsed.map((entry) => ({
            ...emptyEvidence(),
            ...entry,
            sourceType: Object.values(SourceType).includes(entry.sourceType)
              ? entry.sourceType
              : SourceType.FORUM,
            signalStrength: String(entry.signalStrength ?? "3")
          }));
        }
      } catch {
        return initialValues.evidences.length ? initialValues.evidences : [emptyEvidence()];
      }
    }

    return initialValues.evidences.length ? initialValues.evidences : [emptyEvidence()];
  }, [initialValues.evidences, state.fields?.evidencesJson]);
  const [evidences, setEvidences] = useState<EvidenceFormValue[]>(initialEvidenceValues);

  useEffect(() => {
    setEvidences(initialEvidenceValues);
  }, [initialEvidenceValues]);

  return (
    <form action={formAction} className="space-y-8">
      {state.message ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-2">
        <FormField
          label="Title"
          name="title"
          defaultValue={getFieldValue(state, initialValues, "title")}
          error={getError(state, "title")}
        />
        <FormField
          label="Slug"
          name="slug"
          defaultValue={getFieldValue(state, initialValues, "slug")}
          error={getError(state, "slug")}
        />
        <FormField
          label="Category"
          name="category"
          defaultValue={getFieldValue(state, initialValues, "category")}
          error={getError(state, "category")}
        />
        <FormField
          label="Industry"
          name="industry"
          defaultValue={getFieldValue(state, initialValues, "industry")}
          error={getError(state, "industry")}
        />
        <FormField
          label="Geography focus"
          name="geographyFocus"
          defaultValue={getFieldValue(state, initialValues, "geographyFocus")}
          error={getError(state, "geographyFocus")}
        />
        <FormField
          label="Company size"
          name="companySize"
          defaultValue={getFieldValue(state, initialValues, "companySize")}
          error={getError(state, "companySize")}
        />
      </section>

      <TextareaField
        label="Tagline"
        name="tagline"
        defaultValue={getFieldValue(state, initialValues, "tagline")}
        error={getError(state, "tagline")}
        rows={2}
      />
      <TextareaField
        label="Excerpt"
        name="excerpt"
        defaultValue={getFieldValue(state, initialValues, "excerpt")}
        error={getError(state, "excerpt")}
        rows={3}
      />
      <TextareaField
        label="Summary"
        name="summary"
        defaultValue={getFieldValue(state, initialValues, "summary")}
        error={getError(state, "summary")}
        rows={4}
      />
      <TextareaField
        label="Description"
        name="description"
        defaultValue={getFieldValue(state, initialValues, "description")}
        error={getError(state, "description")}
        rows={6}
      />

      <section className="grid gap-5 lg:grid-cols-2">
        <TextareaField
          label="Target user"
          name="targetUser"
          defaultValue={getFieldValue(state, initialValues, "targetUser")}
          error={getError(state, "targetUser")}
          rows={4}
        />
        <TextareaField
          label="Pain point"
          name="painPoint"
          defaultValue={getFieldValue(state, initialValues, "painPoint")}
          error={getError(state, "painPoint")}
          rows={4}
        />
        <TextareaField
          label="Suggested MVP"
          name="suggestedMvp"
          defaultValue={getFieldValue(state, initialValues, "suggestedMvp")}
          error={getError(state, "suggestedMvp")}
          rows={5}
        />
        <TextareaField
          label="Demand signals summary"
          name="demandSignalsSummary"
          defaultValue={getFieldValue(state, initialValues, "demandSignalsSummary")}
          error={getError(state, "demandSignalsSummary")}
          rows={5}
        />
      </section>

      <TextareaField
        label="Risk notes"
        name="riskNotes"
        defaultValue={getFieldValue(state, initialValues, "riskNotes")}
        error={getError(state, "riskNotes")}
        rows={5}
      />

      <section className="grid gap-5 lg:grid-cols-3">
        <SelectField
          label="Skill level"
          name="recommendedSkill"
          defaultValue={getFieldValue(state, initialValues, "recommendedSkill")}
          error={getError(state, "recommendedSkill")}
          options={Object.values(SkillLevel).map((value) => ({
            value,
            label: formatEnumLabel(value)
          }))}
        />
        <SelectField
          label="Status"
          name="status"
          defaultValue={getFieldValue(state, initialValues, "status")}
          error={getError(state, "status")}
          options={Object.values(ProblemStatus).map((value) => ({
            value,
            label: formatEnumLabel(value)
          }))}
        />
        <SelectField
          label="Build time unit"
          name="buildTimeUnit"
          defaultValue={getFieldValue(state, initialValues, "buildTimeUnit")}
          error={getError(state, "buildTimeUnit")}
          options={Object.values(BuildTimeUnit).map((value) => ({
            value,
            label: formatEnumLabel(value)
          }))}
        />
        <NumberField
          label="Build time value"
          name="buildTimeValue"
          defaultValue={getFieldValue(state, initialValues, "buildTimeValue")}
          error={getError(state, "buildTimeValue")}
        />
        <NumberField
          label="Demand score"
          name="demandScore"
          defaultValue={getFieldValue(state, initialValues, "demandScore")}
          error={getError(state, "demandScore")}
        />
        <NumberField
          label="Difficulty score"
          name="difficultyScore"
          defaultValue={getFieldValue(state, initialValues, "difficultyScore")}
          error={getError(state, "difficultyScore")}
        />
        <NumberField
          label="Monetization score"
          name="monetizationScore"
          defaultValue={getFieldValue(state, initialValues, "monetizationScore")}
          error={getError(state, "monetizationScore")}
        />
        <NumberField
          label="Validation score"
          name="validationScore"
          defaultValue={getFieldValue(state, initialValues, "validationScore")}
          error={getError(state, "validationScore")}
        />
        <NumberField
          label="Editorial score"
          name="editorialScore"
          defaultValue={getFieldValue(state, initialValues, "editorialScore")}
          error={getError(state, "editorialScore")}
        />
      </section>

      <div className="grid gap-3 rounded-[1.5rem] border border-border/70 bg-background/55 p-5 md:grid-cols-3">
        <div>
          <p className="text-sm font-medium">Draft</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Private working state. Draft problems do not appear in public queries.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Published</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Eligible for the homepage, directory, and public problem detail pages.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Archived</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Removed from public pages while staying available in admin for edits or reuse.
          </p>
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={initialValues.featured}
          className="size-4 rounded border-border"
        />
        Mark as featured
      </label>

      <CheckboxGroup
        label="Project types"
        name="projectTypes"
        options={Object.values(ProjectType).map((value) => ({
          value,
          label: formatEnumLabel(value)
        }))}
        selected={selectedProjectTypes}
        error={getError(state, "projectTypes")}
      />

      <CheckboxGroup
        label="Monetization types"
        name="monetizationTypes"
        options={Object.values(MonetizationType).map((value) => ({
          value,
          label: formatEnumLabel(value)
        }))}
        selected={selectedMonetizationTypes}
        error={getError(state, "monetizationTypes")}
      />

      <CheckboxGroup
        label="Tags"
        name="tagIds"
        options={tagOptions.map((tag) => ({
          value: tag.id,
          label: tag.name,
          description: tag.description ?? undefined
        }))}
        selected={selectedTagIds}
      />

      <CheckboxGroup
        label="Recommended stack"
        name="stackIds"
        options={stackOptions.map((stack) => ({
          value: stack.id,
          label: stack.name,
          description: stack.description ?? undefined
        }))}
        selected={selectedStackIds}
      />

      <fieldset className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <legend className="text-sm font-medium">Evidence entries</legend>
            <p className="mt-1 text-sm text-muted-foreground">
              Add demand signals, source notes, and supporting references inline.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setEvidences((current) => [...current, emptyEvidence()])}
          >
            Add evidence
          </Button>
        </div>

        <div className="grid gap-4">
          {evidences.map((evidence, index) => (
            <div
              key={`${index}-${state.fields?.evidencesJson ?? "default"}`}
              className="rounded-[1.5rem] border border-border/70 bg-background/60 p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-serif text-2xl">Evidence {index + 1}</h3>
                {evidences.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-700 hover:text-red-800"
                    onClick={() =>
                      setEvidences((current) => current.filter((_, itemIndex) => itemIndex !== index))
                    }
                  >
                    Remove
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <ControlledField
                  label="Title"
                  name="evidenceTitle"
                  value={evidence.title}
                  onChange={(value) =>
                    setEvidences((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, title: value } : item
                      )
                    )
                  }
                  error={getEvidenceError(state, index, "title")}
                />
                <ControlledField
                  label="Source name"
                  name="evidenceSourceName"
                  value={evidence.sourceName}
                  onChange={(value) =>
                    setEvidences((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, sourceName: value } : item
                      )
                    )
                  }
                  error={getEvidenceError(state, index, "sourceName")}
                />
                <ControlledSelectField
                  label="Source type"
                  name="evidenceSourceType"
                  value={evidence.sourceType}
                  onChange={(value) =>
                    setEvidences((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, sourceType: value as SourceType } : item
                      )
                    )
                  }
                  options={Object.values(SourceType).map((value) => ({
                    value,
                    label: formatEnumLabel(value)
                  }))}
                  error={getEvidenceError(state, index, "sourceType")}
                />
                <ControlledField
                  label="Source URL"
                  name="evidenceSourceUrl"
                  value={evidence.sourceUrl}
                  onChange={(value) =>
                    setEvidences((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, sourceUrl: value } : item
                      )
                    )
                  }
                  error={getEvidenceError(state, index, "sourceUrl")}
                />
                <ControlledField
                  label="Captured date"
                  name="evidenceCapturedAt"
                  type="date"
                  value={evidence.capturedAt}
                  onChange={(value) =>
                    setEvidences((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, capturedAt: value } : item
                      )
                    )
                  }
                  error={getEvidenceError(state, index, "capturedAt")}
                />
                <ControlledField
                  label="Signal strength (1-5)"
                  name="evidenceSignalStrength"
                  type="number"
                  min={1}
                  max={5}
                  value={evidence.signalStrength}
                  onChange={(value) =>
                    setEvidences((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, signalStrength: value } : item
                      )
                    )
                  }
                  error={getEvidenceError(state, index, "signalStrength")}
                />
              </div>

              <div className="mt-5 grid gap-5">
                <ControlledTextareaField
                  label="Summary"
                  name="evidenceSummary"
                  value={evidence.summary}
                  onChange={(value) =>
                    setEvidences((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, summary: value } : item
                      )
                    )
                  }
                  error={getEvidenceError(state, index, "summary")}
                  rows={3}
                />
                <ControlledTextareaField
                  label="Snippet"
                  name="evidenceSnippet"
                  value={evidence.snippet}
                  onChange={(value) =>
                    setEvidences((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, snippet: value } : item
                      )
                    )
                  }
                  error={getEvidenceError(state, index, "snippet")}
                  rows={3}
                />
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function ControlledField({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  min,
  max
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-accent"
      />
      {error ? <span className="text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function ControlledTextareaField({
  label,
  name,
  value,
  onChange,
  error,
  rows
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  rows: number;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <textarea
        name={name}
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent"
      />
      {error ? <span className="text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function ControlledSelectField({
  label,
  name,
  value,
  onChange,
  error,
  options
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-accent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function FormField({
  label,
  name,
  defaultValue,
  error
}: {
  label: string;
  name: string;
  defaultValue: string;
  error?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        className="h-11 rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-accent"
      />
      {error ? <span className="text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
  error,
  rows
}: {
  label: string;
  name: string;
  defaultValue: string;
  error?: string;
  rows: number;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent"
      />
      {error ? <span className="text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function NumberField({
  label,
  name,
  defaultValue,
  error
}: {
  label: string;
  name: string;
  defaultValue: string;
  error?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="number"
        name={name}
        min={0}
        max={100}
        defaultValue={defaultValue}
        className="h-11 rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-accent"
      />
      {error ? <span className="text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  error,
  options
}: {
  label: string;
  name: string;
  defaultValue: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-11 rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-accent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function CheckboxGroup({
  label,
  name,
  options,
  selected,
  error
}: {
  label: string;
  name: string;
  options: Array<{ value: string; label: string; description?: string }>;
  selected: Set<string>;
  error?: string;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="grid gap-3 md:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3"
          >
            <input
              type="checkbox"
              name={name}
              value={option.value}
              defaultChecked={selected.has(option.value)}
              className="mt-1 size-4 rounded border-border"
            />
            <span className="grid gap-1">
              <span className="text-sm font-medium">{option.label}</span>
              {option.description ? (
                <span className="text-sm text-muted-foreground">{option.description}</span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
      {error ? <span className="text-sm text-red-700">{error}</span> : null}
    </fieldset>
  );
}
