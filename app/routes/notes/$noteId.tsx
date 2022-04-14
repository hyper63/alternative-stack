import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useCatch, useLoaderData } from "@remix-run/react";
import { z } from "zod";

import type { Note } from "~/services/models/note";
import type { LoaderContext } from "~/types";

type LoaderData = {
  note: Note;
};

const NoteIdSchema = z.string().min(1);

export const loader: LoaderFunction = async ({ request, params, context }) => {
  const { SessionServer, NoteServer } = context as LoaderContext;

  const parent = await SessionServer.requireUserId(request);

  const parsed = NoteIdSchema.safeParse(params.noteId);

  if (!parsed.success) {
    throw new Response("noteId query param required", { status: 404 });
  }

  const note = await NoteServer.getNote({ parent, id: parsed.data });
  if (!note) {
    throw new Response("Not Found", { status: 404 });
  }
  return json<LoaderData>({ note });
};

export const action: ActionFunction = async ({ request, params, context }) => {
  const { SessionServer, NoteServer } = context as LoaderContext;

  const parent = await SessionServer.requireUserId(request);

  const parsed = NoteIdSchema.safeParse(params.noteId);

  if (!parsed.success) {
    throw new Response("noteId query param required", { status: 404 });
  }

  await NoteServer.deleteNote({ parent, id: parsed.data });

  return redirect("/notes");
};

export default function NoteDetailsPage() {
  const data = useLoaderData() as LoaderData;

  return (
    <div>
      <h3 className="text-2xl font-bold">{data.note.title}</h3>
      <p className="py-6">{data.note.body}</p>
      <hr className="my-4" />
      <Form method="post">
        <button
          type="submit"
          className="rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Delete
        </button>
      </Form>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>Note not found</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
