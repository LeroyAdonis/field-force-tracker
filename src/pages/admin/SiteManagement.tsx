import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Plus, MapPin, Pencil } from "lucide-react";
import { toast } from "sonner";
import { DebouncedSearchInput } from "@/components/DebouncedSearchInput";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Site } from "@/lib/types";

export default function SiteManagement() {
  const { sites, addSite, updateSite, removeSite, visits } = useApp();

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState<string>("all");

  // Add site dialog state
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ name: "", address: "", zone: "", contact: "" });

  // Edit site dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editSite, setEditSite] = useState<Site | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", address: "", zone: "", contact: "" });

  // Remove confirmation state
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Site | null>(null);

  // Deactivate confirmation state
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<Site | null>(null);

  // Extract unique zones for filter dropdown
  const uniqueZones = useMemo(
    () => [...new Set(sites.map(s => s.zone).filter(Boolean))].sort(),
    [sites]
  );

  // Filtered sites
  const filteredSites = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return sites.filter(s => {
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.zone.toLowerCase().includes(q);
      const matchesZone = zoneFilter === "all" || s.zone === zoneFilter;
      return matchesSearch && matchesZone;
    });
  }, [sites, searchQuery, zoneFilter]);

  // Visit counts by site
  const visitsBySite = visits.reduce<Record<string, number>>((acc, v) => {
    acc[v.siteId] = (acc[v.siteId] ?? 0) + 1;
    return acc;
  }, {});

  // --- Handlers ---

  const create = () => {
    if (!draft.name.trim() || !draft.address.trim()) {
      toast.error("Name and address required");
      return;
    }
    addSite({ ...draft, active: true });
    setDraft({ name: "", address: "", zone: "", contact: "" });
    setShowAdd(false);
    toast.success("Site created");
  };

  const openEdit = (site: Site) => {
    setEditSite(site);
    setEditDraft({
      name: site.name,
      address: site.address,
      zone: site.zone,
      contact: (site as any).contact ?? "",
    });
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (!editSite) return;
    if (!editDraft.name.trim() || !editDraft.address.trim()) {
      toast.error("Name and address required");
      return;
    }
    updateSite(editSite.id, {
      name: editDraft.name,
      address: editDraft.address,
      zone: editDraft.zone,
    });
    setEditOpen(false);
    setEditSite(null);
    toast.success("Site updated");
  };

  const confirmRemove = () => {
    if (!removeTarget) return;
    removeSite(removeTarget.id);
    setRemoveOpen(false);
    setRemoveTarget(null);
    toast.success("Site removed");
  };

  const handleToggleActive = (site: Site) => {
    if (site.active) {
      // Deactivating — show confirmation
      setDeactivateTarget(site);
      setDeactivateOpen(true);
    } else {
      // Activating — instant, no confirmation
      updateSite(site.id, { active: true });
      toast.success("Site activated");
    }
  };

  const confirmDeactivate = () => {
    if (!deactivateTarget) return;
    updateSite(deactivateTarget.id, { active: false });
    setDeactivateOpen(false);
    setDeactivateTarget(null);
    toast.success("Site deactivated");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="label-eyebrow">Master List</div>
          <h1 className="text-3xl lg:text-4xl font-extrabold mt-1">Site Management</h1>
          <p className="text-foreground-muted text-sm mt-1">Manage the canonical list of inspectable sites.</p>
        </div>
        <Button variant="primary" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> New Site
        </Button>
      </div>

      {/* Search & Zone Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <DebouncedSearchInput
          onValueChange={setSearchQuery}
          placeholder="Search by name, address, or zone…"
          className="sm:max-w-xs"
        />
        <Select value={zoneFilter} onValueChange={setZoneFilter}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="All zones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All zones</SelectItem>
            {uniqueZones.map(z => (
              <SelectItem key={z} value={z}>{z}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Site cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSites.map(s => (
          <div key={s.id} className="surface-card p-5">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-xl bg-accent/10 grid place-items-center text-accent">
                <MapPin className="h-4 w-4" />
              </div>
              <button
                onClick={() => handleToggleActive(s)}
                className={`chip ${s.active ? "chip-success" : "chip-neutral"} cursor-pointer`}
              >
                {s.active ? "Active" : "Inactive"}
              </button>
            </div>
            <div className="font-bold mt-4">{s.name}</div>
            <div className="text-xs text-foreground-muted mt-1">{s.address}</div>
            <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-xs">
              <div className="text-foreground-muted">
                Zone · <span className="font-semibold text-foreground">{s.zone || "—"}</span>
              </div>
              <div className="font-bold tabular-nums">{visitsBySite[s.id] ?? 0} visits</div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => openEdit(s)}
                className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors inline-flex items-center gap-1"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
              <button
                onClick={() => {
                  setRemoveTarget(s);
                  setRemoveOpen(true);
                }}
                className="text-xs font-semibold text-foreground-muted hover:text-danger transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        {filteredSites.length === 0 && (
          <div className="col-span-full surface-card p-12 text-center">
            <div className="text-foreground-muted">No sites match your search.</div>
          </div>
        )}
      </div>

      {/* Add Site Dialog (replaces custom overlay) */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Site</DialogTitle>
            <DialogDescription>Enter the details for the new inspectable site.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Site name"
              value={draft.name}
              onChange={e => setDraft({ ...draft, name: e.target.value })}
            />
            <Input
              placeholder="Address"
              value={draft.address}
              onChange={e => setDraft({ ...draft, address: e.target.value })}
            />
            <Input
              placeholder="Zone"
              value={draft.zone}
              onChange={e => setDraft({ ...draft, zone: e.target.value })}
            />
            <Input
              placeholder="Contact"
              value={draft.contact}
              onChange={e => setDraft({ ...draft, contact: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" onClick={create}>Create Site</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Site Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Site</DialogTitle>
            <DialogDescription>Update the details for this site.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Site name"
              value={editDraft.name}
              onChange={e => setEditDraft({ ...editDraft, name: e.target.value })}
            />
            <Input
              placeholder="Address"
              value={editDraft.address}
              onChange={e => setEditDraft({ ...editDraft, address: e.target.value })}
            />
            <Input
              placeholder="Zone"
              value={editDraft.zone}
              onChange={e => setEditDraft({ ...editDraft, zone: e.target.value })}
            />
            <Input
              placeholder="Contact"
              value={editDraft.contact}
              onChange={e => setEditDraft({ ...editDraft, contact: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Site Confirmation */}
      <ConfirmActionDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title="Remove Site"
        description={`Are you sure you want to remove ${removeTarget?.name ?? "this site"}? This action cannot be undone.`}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={confirmRemove}
      />

      {/* Deactivate Site Confirmation */}
      <ConfirmActionDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title="Deactivate Site"
        description="Deactivating this site will prevent workers from logging visits here. Continue?"
        confirmLabel="Deactivate"
        variant="destructive"
        onConfirm={confirmDeactivate}
      />
    </div>
  );
}
