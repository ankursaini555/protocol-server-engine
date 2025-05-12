import request from "supertest";
import app from "../src/index";

describe("Authentication API", () => {
//   it("should return a token for valid credentials", async () => {
//     const response = await request(app).post("/api/login").send({
//       username: "admin",
//       password: "password123",
//     });

//     expect(response.status).toBe(200);
//     expect(response.body).toHaveProperty("token");
//   });
it("should return health check ", async()=>{
    const response =  await request(app).get("/health")
    expect(response.status).toBe("working")
})

//   it("should return an error for invalid credentials", async () => {
//     const response = await request(app).post("/api/login").send({
//       username: "admin",
//       password: "wrongpassword",
//     });

//     expect(response.status).toBe(401);
//     expect(response.body).toEqual({ error: "Invalid credentials" });
//   });
});
