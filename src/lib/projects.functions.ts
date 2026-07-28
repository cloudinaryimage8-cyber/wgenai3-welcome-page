import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Project, ProjectInput } from "./projects.types";

const projectIdSchema = z.object({ id: z.string().uuid() });
const projectInputSchema = z.object({
  name: z.string().min(1).max(120),
  html_content: z.string(),
  is_public: z.boolean().optional(),
});

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublishableClient } = await import("./supabase.server");
  const supabase = createPublishableClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Project[];
});

export const getProject = createServerFn({ method: "GET" })
  .inputValidator((data) => projectIdSchema.parse(data))
  .handler(async ({ data }) => {
    const { createPublishableClient } = await import("./supabase.server");
    const supabase = createPublishableClient();

    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", data.id)
      .eq("is_public", true)
      .single();

    if (error) throw new Error(error.message);
    if (!project) throw new Error("Project not found");
    return project as Project;
  });

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => projectInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { createPublishableClient } = await import("./supabase.server");
    const supabase = createPublishableClient();

    const input: ProjectInput = {
      name: data.name,
      html_content: data.html_content,
      is_public: data.is_public ?? true,
    };

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        name: input.name,
        html_content: input.html_content,
        is_public: input.is_public,
        user_id: context.userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!project) throw new Error("Failed to create project");
    return project as Project;
  });

export const updateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).max(120).optional(),
        html_content: z.string().optional(),
        is_public: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { createPublishableClient } = await import("./supabase.server");
    const supabase = createPublishableClient();

    const updates: Partial<ProjectInput> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.html_content !== undefined) updates.html_content = data.html_content;
    if (data.is_public !== undefined) updates.is_public = data.is_public;

    const { data: project, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!project) throw new Error("Project not found or not authorized");
    return project as Project;
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => projectIdSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { createPublishableClient } = await import("./supabase.server");
    const supabase = createPublishableClient();

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);

    if (error) throw new Error(error.message);
    return { success: true };
  });
