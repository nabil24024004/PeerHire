import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Image as ImageIcon, Plus, X, Loader2, Trash2 } from "lucide-react";

interface HandwritingSamplesManagerProps {
    userId: string;
    samples: string[];
    canEdit: boolean;
    onSamplesChange: (samples: string[]) => void;
}

export const HandwritingSamplesManager = ({
    userId,
    samples,
    canEdit,
    onSamplesChange,
}: HandwritingSamplesManagerProps) => {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast({
                title: "Invalid file",
                description: "Please select an image file",
                variant: "destructive",
            });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Maximum file size is 5MB",
                variant: "destructive",
            });
            return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("handwriting-samples")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from("handwriting-samples")
                .getPublicUrl(filePath);

            onSamplesChange([...samples, urlData.publicUrl]);

            toast({
                title: "Sample uploaded",
                description: "Your handwriting sample has been added",
            });
        } catch (error: any) {
            console.error("Upload error:", error);
            toast({
                title: "Upload failed",
                description: error.message || "Failed to upload sample",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleDelete = async (sampleUrl: string) => {
        setDeleting(sampleUrl);
        try {
            // Extract file path from URL
            const urlParts = sampleUrl.split("/handwriting-samples/");
            if (urlParts.length < 2) {
                throw new Error("Invalid sample URL");
            }
            const filePath = urlParts[1];

            const { error } = await supabase.storage
                .from("handwriting-samples")
                .remove([filePath]);

            if (error) throw error;

            onSamplesChange(samples.filter((s) => s !== sampleUrl));

            toast({
                title: "Sample deleted",
                description: "Your handwriting sample has been removed",
            });
        } catch (error: any) {
            console.error("Delete error:", error);
            toast({
                title: "Delete failed",
                description: error.message || "Failed to delete sample",
                variant: "destructive",
            });
        } finally {
            setDeleting(null);
        }
    };

    return (
        <>
            <Card className="p-6 border-border bg-card animate-fade-in-up">
                <div className="flex items-center gap-2 mb-4">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Handwriting Samples</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {samples.map((sample, index) => (
                        <div
                            key={index}
                            className="aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors cursor-pointer group relative"
                            onClick={() => setSelectedImage(sample)}
                        >
                            <img
                                src={sample}
                                alt={`Handwriting sample ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            {canEdit && (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(sample);
                                    }}
                                    disabled={deleting === sample}
                                >
                                    {deleting === sample ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </Button>
                            )}
                        </div>
                    ))}

                    {/* Add Sample Card - Only for hirers */}
                    {canEdit && (
                        <div
                            className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 bg-muted/30 hover:bg-muted/50"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploading ? (
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                            ) : (
                                <>
                                    <Plus className="h-8 w-8 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Add Sample</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Empty state */}
                    {samples.length === 0 && !canEdit && (
                        <div className="col-span-full py-8 text-center text-muted-foreground">
                            No handwriting samples uploaded yet
                        </div>
                    )}
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                />
            </Card>

            {/* Fullscreen Image Preview */}
            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        {selectedImage && (
                            <img
                                src={selectedImage}
                                alt="Handwriting sample preview"
                                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
