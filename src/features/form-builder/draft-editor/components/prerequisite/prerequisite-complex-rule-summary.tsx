'use client';

import type { PrerequisiteExpression } from '@/api/form-question/contracts/prerequisite-expression-schema';
import type { Form } from '@/api/form/contracts/form-schema';
import { describePrerequisite } from '../../../utils/prerequisite';
import { Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PrerequisiteComplexRuleSummaryProps {
    prerequisiteExpression: PrerequisiteExpression;
    draft: Form;
}

export default function PrerequisiteComplexRuleSummary({
    prerequisiteExpression,
    draft,
}: PrerequisiteComplexRuleSummaryProps) {
    const ruleSentence = describePrerequisite(prerequisiteExpression, draft);

    return (
        <div className="border-border bg-muted/30 flex items-start gap-3 rounded-md border p-3">
            <Lock className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <div className="space-y-2">
                <Badge variant="outline">Complex rule — view only</Badge>
                <p className="text-foreground text-sm font-medium">
                    Shown when {ruleSentence}
                </p>
                <p className="text-muted-foreground text-sm">
                    This visibility rule uses nested groups or negation, which
                    the in-app editor doesn&apos;t support yet. Contact a form
                    administrator to change it. Other fields on this question
                    can still be edited.
                </p>
            </div>
        </div>
    );
}
