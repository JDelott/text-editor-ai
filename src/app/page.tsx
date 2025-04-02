import TextEditor from '@/components/TextEditor';

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-8">AI Text Editor</h1>
      <TextEditor />
    </div>
  );
}
