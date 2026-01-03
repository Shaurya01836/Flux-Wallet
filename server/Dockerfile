# -------------------------
# Stage 1: Build the Application
# -------------------------
FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copy the project files
COPY pom.xml .
COPY src ./src

# Build the app (skipping tests to speed up deployment)
RUN mvn clean package -DskipTests

# -------------------------
# Stage 2: Run the Application
# -------------------------
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy the JAR file from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose the port Spring Boot runs on
EXPOSE 8080

# Command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]