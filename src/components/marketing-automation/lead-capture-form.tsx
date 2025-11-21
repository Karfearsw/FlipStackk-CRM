'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
// import { Checkbox } from '@/components/ui/checkbox'; // Component doesn't exist
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Alert, AlertDescription } from '@/components/ui/alert'; // Component doesn't exist
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadCaptureForm as LeadCaptureFormType, FormField, FieldCondition } from '@/lib/marketing-automation/types';

interface LeadCaptureFormProps {
  form: LeadCaptureFormType;
  onSubmit: (data: any) => Promise<{ success: boolean; errors?: any[]; leadId?: string }>;
  className?: string;
}

export function LeadCaptureForm({ form, onSubmit, className }: LeadCaptureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());

  // Build validation schema based on form fields
  const validationSchema = useCallback(() => {
    const schema: Record<string, any> = {};
    
    form.fields.forEach(field => {
      let fieldSchema: any;
      
      switch (field.type) {
        case 'email':
          fieldSchema = z.string().email('Please enter a valid email address');
          break;
        case 'phone':
          fieldSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number');
          break;
        case 'text':
          fieldSchema = z.string();
          break;
        case 'textarea':
          fieldSchema = z.string();
          break;
        case 'select':
          fieldSchema = z.string();
          break;
        case 'checkbox':
          fieldSchema = z.boolean();
          break;
        case 'date':
          fieldSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date');
          break;
        default:
          fieldSchema = z.string();
      }

      // Apply validation rules
      if (field.validation?.minLength) {
        fieldSchema = fieldSchema.min(field.validation.minLength, `Minimum length is ${field.validation.minLength}`);
      }
      if (field.validation?.maxLength) {
        fieldSchema = fieldSchema.max(field.validation.maxLength, `Maximum length is ${field.validation.maxLength}`);
      }
      if (field.validation?.pattern) {
        fieldSchema = fieldSchema.regex(new RegExp(field.validation.pattern), field.validation.customMessage || 'Invalid format');
      }

      // Make required if specified
      if (field.required) {
        if (field.type === 'checkbox') {
          fieldSchema = fieldSchema.refine((val: any) => val === true, {
            message: 'This field is required'
          });
        } else {
          fieldSchema = fieldSchema.min(1, 'This field is required');
        }
      }

      schema[field.name] = fieldSchema;
    });

    return z.object(schema);
  }, [form.fields]);

  const { control, handleSubmit, formState: { errors }, watch, trigger, getValues } = useForm({
    resolver: zodResolver(validationSchema()),
    mode: 'onChange',
    defaultValues: form.fields.reduce((acc, field) => {
      acc[field.name] = field.type === 'checkbox' ? false : '';
      return acc;
    }, {} as Record<string, any>)
  });

  const formValues = watch();

  // Handle field conditions
  useEffect(() => {
    const newVisibleFields = new Set<string>();
    
    form.fields.forEach(field => {
      let isVisible = true;
      
      if (field.conditions && field.conditions.length > 0) {
        isVisible = field.conditions.every(condition => {
          const fieldValue = formValues[condition.field];
          return evaluateCondition(condition, fieldValue);
        });
      }
      
      if (isVisible) {
        newVisibleFields.add(field.id);
      }
    });
    
    setVisibleFields(newVisibleFields);
  }, [formValues, form.fields]);

  const evaluateCondition = (condition: FieldCondition, fieldValue: any): boolean => {
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      default:
        return true;
    }
  };

  const onFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // Filter data based on visible fields
      const filteredData = Object.keys(data).reduce((acc, key) => {
        const field = form.fields.find(f => f.name === key);
        if (field && visibleFields.has(field.id)) {
          acc[key] = data[key];
        }
        return acc;
      }, {} as Record<string, any>);

      const result = await onSubmit(filteredData);
      
      if (result.success) {
        setSubmitResult({
          success: true,
          message: form.settings.successMessage
        });
        
        // Handle redirect
        if (form.settings.redirectUrl) {
          setTimeout(() => {
            window.location.href = form.settings.redirectUrl!;
          }, 2000);
        }
      } else {
        setSubmitResult({
          success: false,
          message: form.settings.errorMessage
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitResult({
        success: false,
        message: form.settings.errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    if (!visibleFields.has(field.id)) {
      return null;
    }

    const error = errors[field.name];
    const isInvalid = !!error;

    return (
      <div key={field.id} className="space-y-2">
        <Label 
          htmlFor={field.name}
          className={cn(
            "text-sm font-medium",
            isInvalid && "text-destructive"
          )}
        >
          {field.label}
          {field.required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
        </Label>
        
        <Controller
          name={field.name}
          control={control}
          render={({ field: controllerField }) => {
            switch (field.type) {
              case 'select':
                return (
                  <Select
                    onValueChange={controllerField.onChange}
                    defaultValue={controllerField.value}
                    disabled={isSubmitting}
                    aria-invalid={isInvalid}
                    aria-describedby={isInvalid ? `${field.name}-error` : undefined}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option, index) => (
                        <SelectItem key={index} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              
              case 'checkbox':
                return (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={field.name}
                      checked={controllerField.value}
                      onChange={(e) => controllerField.onChange(e.target.checked)}
                      disabled={isSubmitting}
                      aria-invalid={isInvalid}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      aria-describedby={isInvalid ? `${field.name}-error` : undefined}
                    />
                    <Label htmlFor={field.name} className="text-sm">
                      {field.placeholder}
                    </Label>
                  </div>
                );
              
              case 'textarea':
                return (
                  <Textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    disabled={isSubmitting}
                    aria-invalid={isInvalid}
                    aria-describedby={isInvalid ? `${field.name}-error` : undefined}
                    {...controllerField}
                  />
                );
              
              default:
                return (
                  <Input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    disabled={isSubmitting}
                    aria-invalid={isInvalid}
                    aria-describedby={isInvalid ? `${field.name}-error` : undefined}
                    {...controllerField}
                  />
                );
            }
          }}
        />
        
        {isInvalid && (
          <p id={`${field.name}-error`} className="text-sm text-destructive" role="alert">
            <AlertCircle className="inline h-3 w-3 mr-1" />
            {error?.message as string}
          </p>
        )}
      </div>
    );
  };

  const totalSteps = 1; // Single step form for now - multi-step layout not implemented

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader>
        <CardTitle>{form.settings.title}</CardTitle>
        {form.settings.description && (
          <CardDescription>{form.settings.description}</CardDescription>
        )}
        
        {totalSteps > 1 && (
          <div className="mt-4">
            <Progress value={((currentStep + 1) / totalSteps) * 100} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2" aria-live="polite">
              Step {currentStep + 1} of {totalSteps}
            </p>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6" role="form">
          {form.fields.map(field => renderField(field))}
          
          {form.settings.consentText && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {form.settings.consentText}
              </p>
            </div>
          )}
          
          {submitResult && (
            <div className={`p-4 rounded-md border ${submitResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <div className="flex items-center">
                {submitResult.success ? (
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                {submitResult.message}
              </div>
            </div>
          )}
          
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            aria-label={form.settings.submitButtonText}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              form.settings.submitButtonText
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}