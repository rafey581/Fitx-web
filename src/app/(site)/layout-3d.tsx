import { SmoothScroll } from "@/components/3d/SmoothScroll";

export function Layout3D({ children }: { children: React.ReactNode }) {
  return <SmoothScroll>{children}</SmoothScroll>;
}
