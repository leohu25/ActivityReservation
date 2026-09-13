"use client";

import React from "react";
import {
    CustomerFormModal,
    type CustomerFormModalProps,
} from "./CustomerFormModal";

export interface CreateCustomerModalProps {
    readonly categories: CustomerFormModalProps["categories"];
    readonly tags: CustomerFormModalProps["tags"];
    readonly onClose: () => void;
    readonly onCreated?: () => void;
}

/**
 * @deprecated 请直接使用统一三态模态框 `CustomerFormModal` (mode="create")
 */
export function CreateCustomerModal({
    categories,
    tags,
    onClose,
    onCreated,
}: CreateCustomerModalProps) {
    return (
        <CustomerFormModal
            open={true}
            mode="create"
            categories={categories}
            tags={tags}
            onClose={onClose}
            onSuccess={onCreated}
        />
    );
}

export { CustomerFormModal };
