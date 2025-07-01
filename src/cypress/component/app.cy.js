import { SignupForm } from "@/components/ui/SignUpForm";
import React from "react";

describe("Signup Form", () => {
    it("should have the signup text", () => {
        const setCustomLoadingState = cy.stub()
        cy.mount(<SignupForm setCustomLoadingState={setCustomLoadingState} />)

        cy.get("[data-test='signup-message']").should("exist")
    })
})