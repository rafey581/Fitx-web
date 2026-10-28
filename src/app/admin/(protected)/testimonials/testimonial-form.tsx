import { SimpleForm } from "@/components/admin/simple-form";
import { saveTestimonialAction } from "@/server/actions/simple-content";

export function TestimonialForm({
  id,
  name = "",
  quote = "",
  photo = null,
  photoRemovable = true,
}: {
  id?: string;
  name?: string;
  quote?: string;
  photo?: string | null;
  photoRemovable?: boolean;
}) {
  return (
    <SimpleForm
      action={saveTestimonialAction}
      id={id}
      backHref="/admin/testimonials"
      heading={{ name: "name", label: "Client name", value: name, placeholder: "e.g. Ayesha Khan" }}
      text={{
        name: "quote",
        label: "Review",
        value: quote,
        rows: 7,
        placeholder: "What the client said, in their own words",
      }}
      photo={{ label: "Client photo (optional)", current: photo, removable: photoRemovable, round: true, hint: "A square photo of the client's face works best." }}
      submitLabel={id ? "Save changes" : "Add testimonial"}
    />
  );
}
