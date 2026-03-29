import { useMutation } from "@tanstack/react-query";
import type { BeamCalculation, BeamInput } from "../backend.d";
import { useActor } from "./useActor";

export function useStoreCalculation() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (params: {
      input: BeamInput;
      output: BeamCalculation;
    }) => {
      if (!actor) return;
      await actor.storeCalculation(params.input, params.output);
    },
  });
}
