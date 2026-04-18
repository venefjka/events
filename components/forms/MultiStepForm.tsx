import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/themes/useTheme';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export interface Step {
  id: string;
  title: string;
  desc: string;
  component: React.ComponentType<any>;
  validation?: (data: any) => Record<string, string>;
  isComplete?: (data: any) => boolean;
  shouldShow?: (data: any) => boolean;
  disableScroll?: boolean;
}

export interface MultiStepFormProps {
  steps: Step[];
  initialData?: any;
  onSubmit: (data: any) => void | Promise<void>;
  submitButtonText?: string;
  mode?: 'register' | 'edit';
  headerTitle?: string;
  onCancel?: () => void;
}

export const MultiStepForm: React.FC<MultiStepFormProps> = ({
  steps,
  initialData = {},
  onSubmit,
  submitButtonText = 'Сохранить',
  mode = 'register',
  headerTitle,
  onCancel,
}) => {
  const theme = useTheme();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const visibleSteps = useMemo(
    () => steps.filter((step) => (step.shouldShow ? step.shouldShow(formData) : true)),
    [steps, formData]
  );

  const currentStepConfig = visibleSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === visibleSteps.length - 1;
  const progress = visibleSteps.length ? (currentStep + 1) / visibleSteps.length : 0;

  useEffect(() => {
    if (!visibleSteps.length) return;
    if (currentStep >= visibleSteps.length) {
      setCurrentStep(Math.max(0, visibleSteps.length - 1));
    }
  }, [currentStep, visibleSteps.length]);

  useEffect(() => {
    setScrollEnabled(!currentStepConfig?.disableScroll);
  }, [currentStepConfig?.disableScroll]);


  const getValidationErrors = (data: any) => {
    return currentStepConfig?.validation ? currentStepConfig.validation(data) : {};
  };

  const updateFormData = (data: any) => {
    setFormData((prev: any) => {
      const next = { ...prev, ...data };

      if (showErrors) {
        setStepErrors(getValidationErrors(next));
      }

      return next;
    });
  };

  const handleNext = () => {
    const errors = getValidationErrors(formData);

    if (Object.keys(errors).length > 0) {
      setShowErrors(true);
      setStepErrors(errors);
      return;
    }

    setShowErrors(false);
    setStepErrors({});

    if (isLastStep) {
      handleSubmit();
    } else {
      setShowErrors(false);
      setStepErrors({});
      setCurrentStep((prev) => Math.min(prev + 1, visibleSteps.length - 1));
    }
  };

  const handleBack = () => {
    if (isFirstStep) {
      onCancel?.();
    } else {
      setShowErrors(false);
      setStepErrors({});
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepComponent = currentStepConfig?.component;

  return (

    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header
          title={headerTitle + '. Шаг ' + String(currentStep + 1) || currentStepConfig?.title}
          showBackButton={true}
          onBackPress={handleBack}
          borderBottom={false}
          backgroundColor={theme.colors.surface}
          heightVariant="short"
        />

        {mode === 'register' && currentStepConfig && (
          <View style={{
            paddingTop: theme.spacing.lg,
            backgroundColor: theme.colors.surface,
            paddingHorizontal: theme.spacing.screenPaddingHorizontal,
            borderBottomWidth: theme.spacing.borderWidth, borderBottomColor: theme.colors.border,
            height: theme.spacing.headerHeightLarge,
          }}>
            <ProgressBar progress={progress} />
            <View style={{ paddingVertical: theme.spacing.xxxl }}>
              <Text style={{ ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing.sm, }}>
                {currentStepConfig.title}
              </Text>
              <Text style={{ ...theme.typography.caption, color: theme.colors.textSecondary }}>
                {currentStepConfig.desc}
              </Text>
            </View>
          </View>
        )}

        <KeyboardAwareScrollView
          style={{ flex: 1, backgroundColor: theme.colors.background }}
          contentContainerStyle={{ flexGrow: 1, backgroundColor: theme.colors.background }}
          enableOnAndroid
          extraScrollHeight={-70}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={scrollEnabled}
        >
          {CurrentStepComponent && (
            <CurrentStepComponent
              key={currentStepConfig.id}
              data={formData}
              updateData={updateFormData}
              mode={mode}
              errors={stepErrors}
              showErrors={showErrors}
              setScrollEnabled={setScrollEnabled}
            />
          )}

        </KeyboardAwareScrollView>

        <View style={{
          backgroundColor: theme.colors.surface,
          paddingHorizontal: theme.spacing.screenPaddingHorizontal,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.xxxl,
          borderTopWidth: theme.spacing.borderWidth,
          borderTopColor: theme.colors.border,
        }}>
          <Button
            title={isLastStep ? submitButtonText : 'Продолжить'}
            onPress={handleNext}
            variant="primary"
            size="medium"
            disabled={isSubmitting || (currentStepConfig?.isComplete ? !currentStepConfig.isComplete(formData) : false)}
            loading={isSubmitting}
            fullWidth
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({

});
