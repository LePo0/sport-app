export function calculateBmi(heightCm: number, weightKg: number): number {
    const bmi = weightKg / (heightCm / 100) ** 2;
    return Math.round(bmi * 10) / 10;
}

export function getBmiCategory(bmi: number): string {
    if (bmi < 18.5) return 'Insuffisance pondérale';
    if (bmi < 25) return 'Poids normal';
    if (bmi < 30) return 'Surpoids';
    return 'Obésité';
}
