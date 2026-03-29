import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface BeamResult {
    output: BeamCalculation;
    input: BeamInput;
}
export interface ShearAssessment {
    shearSafe: boolean;
    shearStressTc: number;
    shearCapacityVc: number;
    percentageSteel: number;
}
export interface BeamCalculation {
    adoptedAst: number;
    factoredShear: number;
    actualMomentResistance: number;
    overallSafeForBending: boolean;
    minimumAst: number;
    isDoublyReinforced: boolean;
    safeMoment: number;
    providedSteelMoreThanMin: boolean;
    limitingMoment: number;
    requiredAst: number;
    isUnsafe: boolean;
    barSelection: BarSelection;
    effectiveDepthAdopted: number;
    shearAssessment: ShearAssessment;
    neutralAxisDepth: number;
}
export interface BeamInput {
    fy: number;
    fck: number;
    factoredMomentMu: number;
    depthD: number;
    factoredShearVu: number;
    beamDesignation: string;
    breadthB: number;
    effectiveDepthD: number;
}
export interface BarSelection {
    diameter: number;
    quantity: bigint;
}
export interface backendInterface {
    getCalculationByDesignation(designation: string): Promise<BeamResult>;
    getCalculations(): Promise<Array<BeamResult>>;
    storeCalculation(input: BeamInput, output: BeamCalculation): Promise<void>;
}
