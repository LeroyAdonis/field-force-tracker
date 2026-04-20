import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { useApp } from "@/lib/store";
import type { Visit } from "@/lib/types";
import { MapPin, Calendar, Route, ClipboardCheck, FileText, ImageIcon } from "lucide-react";

interface VisitDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: Visit | null;
}

/**
 * Drawer component showing visit details including site info,
 * inspection data, photo gallery, and action buttons.
 */
export function VisitDetailDrawer({
  open,
  onOpenChange,
  visit,
}: VisitDetailDrawerProps) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { sites, removeVisit } = useApp();

  if (!visit) return null;

  const site = sites.find((s) => s.id === visit.siteId);
  const photos = visit.inspection.photos?.map((p) => p.dataUrl) ?? [];

  const handleDelete = () => {
    removeVisit(visit.id);
    setConfirmDeleteOpen(false);
    onOpenChange(false);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{site?.name ?? "Unknown Site"}</DrawerTitle>
            <DrawerDescription>
              {site?.address ?? "No address available"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-4 overflow-y-auto px-4 pb-4">
            {/* Visit details */}
            <div className="grid gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Date:</span>
                <span>{formatDate(visit.timestamp)}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Route className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Distance:</span>
                <span>{visit.km} km</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Inspection:</span>
                <span>{visit.inspection.type}</span>
              </div>

              {visit.inspection.notes && (
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Notes:</span>
                  <span>{visit.inspection.notes}</span>
                </div>
              )}
            </div>

            {/* Photo gallery */}
            {photos.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ImageIcon className="h-4 w-4" />
                  Photos ({photos.length})
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => openLightbox(idx)}
                      className="overflow-hidden rounded-lg border bg-muted"
                    >
                      <img
                        src={photo}
                        alt={`Photo ${idx + 1}`}
                        className="h-20 w-full object-cover transition-opacity hover:opacity-80"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DrawerFooter>
            <Button variant="outline" disabled title="Coming soon">
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setConfirmDeleteOpen(true)}
            >
              Delete
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete confirmation */}
      <ConfirmActionDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete Visit"
        description="Are you sure you want to delete this visit? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />

      {/* Photo lightbox */}
      <PhotoLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        photos={photos}
        initialIndex={lightboxIndex}
      />
    </>
  );
}
