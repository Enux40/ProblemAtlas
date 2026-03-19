"use server";

import { Prisma } from "@prisma/client";
import { newsletterSignupSchema } from "@/lib/newsletter";
import { prisma } from "@/lib/prisma";

export type NewsletterSignupState = {
  status?: "success" | "error";
  message?: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getStringArray(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is string => typeof value === "string");
}

export async function signupForNewsletter(
  _prevState: NewsletterSignupState,
  formData: FormData
): Promise<NewsletterSignupState> {
  const parsed = newsletterSignupSchema.safeParse({
    email: getString(formData, "email"),
    firstName: getString(formData, "firstName"),
    source: getString(formData, "source") || "homepage",
    interests: getStringArray(formData, "interests")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please check the form and try again."
    };
  }

  try {
    await prisma.newsletterSignup.create({
      data: {
        email: parsed.data.email.toLowerCase(),
        firstName: parsed.data.firstName,
        source: parsed.data.source,
        interests: parsed.data.interests
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        status: "success",
        message: "You’re already on the list. We’ll only send the good stuff."
      };
    }

    return {
      status: "error",
      message: "We couldn’t save your signup right now. Please try again."
    };
  }

  return {
    status: "success",
    message: "You’re in. We’ll send new problem briefs and notable updates."
  };
}
