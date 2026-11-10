import { TabsFrame } from "@/components/frames";

export default function TabsLayout({ children }: LayoutProps<"/">) {
  return <TabsFrame>{children}</TabsFrame>;
}
