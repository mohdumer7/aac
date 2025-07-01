describe("App Flow",()=>{
    it("should render the signup form",()=>{
        cy.visit("http://localhost:3000")

        cy.get("[data-test='signup-message']").should("exist")
    })
})