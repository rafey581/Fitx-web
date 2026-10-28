import { SimpleForm } from "@/components/admin/simple-form";
import { saveBlogPostAction } from "@/server/actions/simple-content";

export function PostForm({
  id,
  title = "",
  content = "",
  cover = null,
  coverRemovable = true,
}: {
  id?: string;
  title?: string;
  content?: string;
  cover?: string | null;
  coverRemovable?: boolean;
}) {
  return (
    <SimpleForm
      action={saveBlogPostAction}
      id={id}
      backHref="/admin/blog"
      heading={{ name: "title", label: "Heading", value: title, placeholder: "e.g. 5 tips to start training after Eid" }}
      text={{
        name: "content",
        label: "Text",
        value: content,
        rows: 16,
        placeholder: "Write your post here…",
        hint: "Leave an empty line between paragraphs. A short line on its own (without a full stop) becomes a subheading. Start lines with • or - for a list.",
      }}
      photo={{ label: "Cover picture", current: cover, removable: coverRemovable, hint: "Shown at the top of the post and on the Blog page. A wide (landscape) photo looks best." }}
      submitLabel={id ? "Save changes" : "Publish post"}
    />
  );
}
