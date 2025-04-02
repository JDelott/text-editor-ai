import TextEditor from '@/components/TextEditor';

export default function Home() {
  return (
    <div className="min-h-screen bg-black p-8">
      <h1 className="text-3xl font-light tracking-tight text-white mb-8">AI Text Editor</h1>
      <TextEditor />
    </div>
  );
}
