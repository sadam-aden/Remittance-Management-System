"use client";

import { useState } from "react";
import { Search, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchBeneficiariesAction } from "@/lib/actions/sent-actions";
import type { BeneficiarySearchResult } from "@/lib/repositories/beneficiary-repository";

export interface SelectedBeneficiary {
  /** null = new beneficiary (no match found, or the admin chose to skip lookup). */
  id: string | null;
  fullName: string;
  phone: string | null;
  country: string | null;
  city: string | null;
}

const EMPTY_NEW: SelectedBeneficiary = { id: null, fullName: "", phone: null, country: null, city: null };

export function BeneficiaryLookup({
  onSelect,
  initialSelected,
}: {
  onSelect: (beneficiary: SelectedBeneficiary) => void;
  /** Pre-selects a beneficiary (e.g. when duplicating a past transaction) instead of starting on the search box. */
  initialSelected?: SelectedBeneficiary;
}) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<BeneficiarySearchResult[] | null>(null);
  const [selected, setSelected] = useState<SelectedBeneficiary | null>(initialSelected ?? null);

  async function handleSearch() {
    if (!query.trim()) return;
    setIsSearching(true);
    setResults(null);
    try {
      const matches = await searchBeneficiariesAction(query);
      if (matches.length === 0) {
        toast.info("No matching beneficiary — enter their details below to register a new one.");
        chooseNew();
      } else if (matches.length === 1) {
        chooseMatch(matches[0]);
      } else {
        setResults(matches);
      }
    } catch {
      toast.error("Search failed — please try again.");
    } finally {
      setIsSearching(false);
    }
  }

  function chooseMatch(b: BeneficiarySearchResult) {
    const value: SelectedBeneficiary = {
      id: b.id,
      fullName: b.fullName,
      phone: b.phone,
      country: b.country,
      city: b.city,
    };
    setSelected(value);
    setResults(null);
    onSelect(value);
    toast.success(`Loaded ${b.fullName}'s saved details`);
  }

  function chooseNew() {
    setSelected(EMPTY_NEW);
    setResults(null);
    onSelect(EMPTY_NEW);
  }

  function reset() {
    setSelected(null);
    setResults(null);
    setQuery("");
    onSelect(EMPTY_NEW);
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-md border border-hairline bg-void px-3 py-2 text-sm">
        <span className="flex items-center gap-2 text-text-muted">
          <UserCheck size={14} className={selected.id ? "text-income" : "text-report"} />
          {selected.id ? `Matched: ${selected.fullName || "beneficiary"}` : "New beneficiary"}
        </span>
        <button type="button" onClick={reset} className="text-xs text-report hover:underline">
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          placeholder="Recipient phone or name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={handleSearch} disabled={isSearching}>
          <Search size={14} /> {isSearching ? "Searching..." : "Search"}
        </Button>
      </div>
      <button type="button" onClick={chooseNew} className="w-fit text-xs text-text-muted hover:underline">
        Skip — this is a new recipient
      </button>

      {results && results.length > 1 && (
        <div className="flex flex-col divide-y divide-hairline rounded-md border border-hairline">
          {results.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => chooseMatch(b)}
              className="flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-hairline/30"
            >
              <div>
                <p className="text-text-primary">{b.fullName}</p>
                <p className="text-xs text-text-muted">
                  {b.phone ?? "—"} · {b.country ?? "—"}
                </p>
              </div>
              <span className="shrink-0 pl-3 text-xs text-text-muted">
                {b.lastTransactionDate
                  ? `Last: ${new Date(b.lastTransactionDate).toLocaleDateString("en-US")}`
                  : "No prior transfers"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
