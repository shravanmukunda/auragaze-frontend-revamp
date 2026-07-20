import { prisma } from "@/lib/prisma";
import type { AddressInput, SavedAddress } from "@/types/address";

export class AddressError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AddressError";
    this.status = status;
  }
}

function mapAddress(address: {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
}): SavedAddress {
  return {
    id: address.id,
    label: address.label,
    line1: address.line1,
    line2: address.line2 ?? undefined,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    phone: address.phone,
    isDefault: address.isDefault,
  };
}

export function parseAddressInput(
  value: unknown,
): { data?: AddressInput; error?: string } {
  if (!value || typeof value !== "object") {
    return { error: "Invalid request body." };
  }

  const body = value as Record<string, unknown>;
  const label = typeof body.label === "string" ? body.label.trim() : "";
  const line1 = typeof body.line1 === "string" ? body.line1.trim() : "";
  const line2 =
    typeof body.line2 === "string" ? body.line2.trim() || undefined : undefined;
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const state = typeof body.state === "string" ? body.state.trim() : "";
  const postalCode =
    typeof body.postalCode === "string" ? body.postalCode.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!label) return { error: "Label is required." };
  if (!line1 || line1.length < 5) return { error: "Enter a complete street address." };
  if (!city) return { error: "City is required." };
  if (!state) return { error: "State is required." };
  if (!/^\d{6}$/.test(postalCode)) {
    return { error: "Enter a valid 6-digit postal code." };
  }
  if (phone.replace(/\D/g, "").length < 10) {
    return { error: "Enter a valid phone number." };
  }

  return {
    data: {
      label,
      line1,
      line2,
      city,
      state,
      postalCode,
      phone,
      isDefault: body.isDefault === true,
    },
  };
}

export async function listUserAddresses(userId: string) {
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  return addresses.map(mapAddress);
}

export async function createUserAddress(userId: string, input: AddressInput) {
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const existingCount = await tx.address.count({ where: { userId } });

    const address = await tx.address.create({
      data: {
        userId,
        label: input.label,
        line1: input.line1,
        line2: input.line2,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        phone: input.phone,
        isDefault: input.isDefault ?? existingCount === 0,
      },
    });

    return mapAddress(address);
  });
}

export async function updateUserAddress(
  userId: string,
  addressId: string,
  input: AddressInput,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw new AddressError("Address not found.", 404);
    }

    if (input.isDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    const address = await tx.address.update({
      where: { id: addressId },
      data: {
        label: input.label,
        line1: input.line1,
        line2: input.line2,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        phone: input.phone,
        isDefault: input.isDefault ?? existing.isDefault,
      },
    });

    return mapAddress(address);
  });
}

export async function deleteUserAddress(userId: string, addressId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw new AddressError("Address not found.", 404);
    }

    await tx.address.delete({ where: { id: addressId } });

    if (existing.isDefault) {
      const next = await tx.address.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });
      if (next) {
        await tx.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
  });
}

export async function setDefaultAddress(userId: string, addressId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw new AddressError("Address not found.", 404);
    }

    await tx.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    const address = await tx.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });

    return mapAddress(address);
  });
}
