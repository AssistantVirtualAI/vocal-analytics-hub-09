
import React, { useState } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Organization } from '@/types/organization';
import { ElevenLabsDiagnosticsButton } from '@/components/dashboard/ElevenLabsDiagnosticsButton';

const organizationSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  agentId: z.string().min(2, "L'ID de l'agent est requis"),
  description: z.string().optional(),
  slug: z.string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Le slug doit contenir uniquement des lettres minuscules, des chiffres et des tirets")
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

interface OrganizationFormProps {
  onSubmit: (values: OrganizationFormValues) => Promise<void>;
  initialData?: Organization;
  isSubmitting?: boolean;
  buttonText?: string;
}

export function OrganizationForm({
  onSubmit,
  initialData,
  isSubmitting = false,
  buttonText = "Enregistrer"
}: OrganizationFormProps) {
  const [isLoading, setIsLoading] = useState(isSubmitting);
  
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: initialData?.name || "",
      agentId: initialData?.agentId || "",
      description: initialData?.description || "",
      slug: initialData?.slug || ""
    }
  });

  const handleSubmit = async (values: OrganizationFormValues) => {
    try {
      setIsLoading(true);
      await onSubmit(values);
      form.reset(values);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = () => {
    const name = form.getValues("name");
    if (name) {
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      
      form.setValue("slug", slug);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de l'organisation</FormLabel>
              <FormControl>
                <Input placeholder="Nom de l'organisation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel>Slug URL</FormLabel>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={generateSlug}
                >
                  Générer
                </Button>
              </div>
              <FormControl>
                <Input placeholder="slug-url" {...field} />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                URL d'accès: {window.location.origin}/{field.value}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID de l'agent ElevenLabs</FormLabel>
              <FormControl>
                <Input placeholder="ID de l'agent ElevenLabs" {...field} />
              </FormControl>
              <FormDescription className="flex items-center gap-2">
                <span>Identifiant de l'agent ElevenLabs utilisé pour les appels</span>
                {field.value && <ElevenLabsDiagnosticsButton agentId={field.value} size="sm" variant="outline" />}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Description de l'organisation" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading || isSubmitting}>
          {isLoading ? "Enregistrement..." : buttonText}
        </Button>
      </form>
    </Form>
  );
}
