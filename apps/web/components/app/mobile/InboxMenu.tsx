import { useAppStore } from "@/stores/app.store";
import { IconArrowLeft } from "@tabler/icons-react";

export default function InboxMenu() {
  const appStore = useAppStore();

  return (
    <>
      <div
        className="flex items-center relative"
        onClick={() => {
          appStore.setMobileMenuComponent(null);
        }}
      >
        <IconArrowLeft className="w-8 h-8" />
        <div className="absolute w-full flex justify-center">
          <h4 className="uppercase font-bold text-xl">Inbox</h4>
        </div>
      </div>
    </>
  );
}
