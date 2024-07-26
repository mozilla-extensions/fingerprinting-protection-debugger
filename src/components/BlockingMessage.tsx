import useStore from "../store";

export default function BlockingMessage() {
  const message = useStore((state) => state.blockingMessage.message);

  if (!message) {
    return null;
  }

  return (
    <div className="fixed h-screen w-screen bg-white dark:bg-slate-900">
      <p>{message}</p>
    </div>
  );
}
