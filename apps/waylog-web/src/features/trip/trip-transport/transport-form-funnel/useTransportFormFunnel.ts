import { useLoading } from "@waylog/react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useQueryParamState } from "~shared/hooks/urls/useQueryParamState";
import type { TransportFormValues } from "~features/transport/transport-form/transportForm.types";
import {
  TRANSPORT_FORM_STEPS,
  type TransportFormStep,
  type TransportSubmitValues,
} from "./transportForm.types";
import { useTransportForm } from "./useTransportForm";
import { useTripId } from "~features/trip/useTripId";

interface TransportFormFunnel {
  tripId: string;
  currentStep: TransportFormStep;
  stepIndex: number;
  form: Partial<TransportSubmitValues>;
  update: (value: Partial<TransportSubmitValues>) => void;
  goNext: () => void;
  goBack: () => void;
  submit: (lastInput?: Partial<TransportSubmitValues>) => void;
  isSubmitting: boolean;
  error: unknown;
}

export function useTransportFormFunnel(): TransportFormFunnel {
  const tripId = useTripId();
  const navigate = useNavigate();
  const { form, update, create } = useTransportForm(tripId);
  const [isSubmitting, startSubmit] = useLoading();
  const [error, setError] = useState<unknown>(null);

  const [currentStep, setStep] = useQueryParamState<TransportFormStep>("step", {
    defaultValue: "type",
  });
  const stepIndex = TRANSPORT_FORM_STEPS.indexOf(currentStep);

  // 새로고침이나 직접 링크로 중간 단계에 들어오면 메모리 폼이 비어있다.
  // 빈 화면을 보이지 말고, 필요한 입력이 있는 첫 단계로 되돌린다.
  useEffect(() => {
    if (currentStep !== "type" && form.type == null) setStep("type");
    if (currentStep === "ticket" && form.departureAt == null) setStep("type");
  }, [currentStep, form.departureAt, form.type, setStep]);

  const goNext = () => setStep(TRANSPORT_FORM_STEPS[stepIndex + 1]);

  const goBack = () => {
    if (stepIndex > 0) return setStep(TRANSPORT_FORM_STEPS[stepIndex - 1]);
    if (window.history.length <= 1) return navigate("/");
    navigate(-1);
  };

  const submit = (lastInput?: Partial<TransportFormValues>) => {
    startSubmit(async () => {
      try {
        const created = await create(lastInput);
        // 뒤로가기로 퍼널에 되돌아오지 않도록 스텝 히스토리를 덮는다.
        await navigate(`/trip/${tripId}/transport/${created.id}`, {
          replace: true,
        });
      } catch (e) {
        setError(e);
      }
    });
  };

  return {
    tripId,
    currentStep,
    stepIndex,
    form,
    update,
    goNext,
    goBack,
    submit,
    isSubmitting,
    error,
  };
}
