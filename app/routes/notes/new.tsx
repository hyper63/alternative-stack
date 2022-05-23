import * as React from "react";
import type { ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { z } from "zod";

import type { LoaderContext } from "~/types";

type ActionData = {
  errors?: {
    title?: string;
    body?: string;
  };
};

const FormDataSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
});

export const action: ActionFunction = async ({ request, context }) => {
  const { SessionServer, NoteServer } = context as LoaderContext;

  const parent = await SessionServer.requireUserId(request);

  const formData = await request.formData();

  const parsed = FormDataSchema.safeParse({
    title: formData.get("title") ?? null,
    body: formData.get("body") ?? null,
  });

  if (!parsed.success) {
    const errors = parsed.error.format();
    return json<ActionData>(
      {
        errors: {
          title: errors.title?._errors.join(". "),
          body: errors.body?._errors.join(". "),
        },
      },
      { status: 400 }
    );
  }

  const { title, body } = parsed.data;

  const note = await NoteServer.createNote({ title, body, parent });

  return redirect(`/notes/${note.id}`);
};

export default function NewNotePage() {
  const actionData = useActionData() as ActionData;
  const titleRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.title) {
      titleRef.current?.focus();
    } else if (actionData?.errors?.body) {
      bodyRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Form
      method="post"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
    >
      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Title: </span>
          <input
            ref={titleRef}
            name="title"
            className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
            aria-invalid={actionData?.errors?.title ? true : undefined}
            aria-errormessage={actionData?.errors?.title ? "title-error" : undefined}
          />
        </label>
        {actionData?.errors?.title && (
          <div className="pt-1 text-red-700" id="title-error">
            {actionData.errors.title}
          </div>
        )}
      </div>

      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Body: </span>
          <textarea
            ref={bodyRef}
            name="body"
            rows={8}
            className="w-full flex-1 rounded-md border-2 border-blue-500 py-2 px-3 text-lg leading-6"
            aria-invalid={actionData?.errors?.body ? true : undefined}
            aria-errormessage={actionData?.errors?.body ? "body-error" : undefined}
          />
        </label>
        {actionData?.errors?.body && (
          <div className="pt-1 text-red-700" id="body-error">
            {actionData.errors.body}
          </div>
        )}
      </div>

      <div className="text-right">
        <button
          type="submit"
          className="rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Save
        </button>
      </div>
    </Form>
  );
}
