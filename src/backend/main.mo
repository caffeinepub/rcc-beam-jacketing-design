import Text "mo:core/Text";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import List "mo:core/List";
import Runtime "mo:core/Runtime";

actor {
  type BeamInput = {
    factoredMomentMu : Float;
    fck : Float;
    fy : Float;
    breadthB : Float;
    depthD : Float;
    effectiveDepthD : Float;
    factoredShearVu : Float;
    beamDesignation : Text;
  };

  type BarSelection = {
    diameter : Float;
    quantity : Nat;
  };

  type ShearAssessment = {
    percentageSteel : Float;
    shearStressTc : Float;
    shearCapacityVc : Float;
    shearSafe : Bool;
  };

  type BeamCalculation = {
    effectiveDepthAdopted : Float;
    limitingMoment : Float;
    requiredAst : Float;
    minimumAst : Float;
    adoptedAst : Float;
    neutralAxisDepth : Float;
    actualMomentResistance : Float;
    isDoublyReinforced : Bool;
    isUnsafe : Bool;
    barSelection : BarSelection;
    shearAssessment : ShearAssessment;
    safeMoment : Float;
    factoredShear : Float;
    providedSteelMoreThanMin : Bool;
    overallSafeForBending : Bool;
  };

  type BeamResult = {
    input : BeamInput;
    output : BeamCalculation;
  };

  // Compare BeamResult
  module BeamResult {
    public func compare(result1 : BeamResult, result2 : BeamResult) : Order.Order {
      Text.compare(result1.input.beamDesignation, result2.input.beamDesignation);
    };
  };

  let calculationStore = List.empty<BeamResult>();

  public func storeCalculation(input : BeamInput, output : BeamCalculation) : async () {
    let newCalculation = { input; output };
    calculationStore.add(newCalculation);
  };

  // Retrieve all calculations, sorted by beam designation for organization.
  public query func getCalculations() : async [BeamResult] {
    calculationStore.values().toArray().sort();
  };

  public query ({ caller }) func getCalculationByDesignation(designation : Text) : async BeamResult {
    for (calc in calculationStore.values()) {
      if (calc.input.beamDesignation == designation) {
        return calc;
      };
    };
    Runtime.trap("Calculation not found for designation: " # designation);
  };
};
