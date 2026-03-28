import { GenerateForm } from "@/features/generate/components/GenerateForm";

export default function GeneratePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">新規薬歴生成</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          自由記述・処方区分・疾患を入力して薬歴下書きを生成します
        </p>
      </div>
      <GenerateForm />
    </div>
  );
}
