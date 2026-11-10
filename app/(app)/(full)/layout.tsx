import { FullFrame } from "@/components/frames";

export default function FullLayout({ children }: LayoutProps<"/">) {
  return <FullFrame>{children}</FullFrame>;
}
