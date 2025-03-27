const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const connectDB = require("./config/db");
const fileRoutes = require("./routes/fileRoutes");
const visitorRoutes = require("./routes/visitorRoutes");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");

const app = express();
let server;

// Try multiple ports if the default is busy
const startServer = (portToTry) => {
  server = http.createServer(app);
  
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.warn(`Port ${portToTry} is already in use, trying ${portToTry + 1}...`);
      setTimeout(() => {
        server.close();
        startServer(portToTry + 1);
      }, 1000);
    } else {
      logger.error('Server error:', error);
    }
  });
  
  server.listen(portToTry, () => {
    logger.info(`Server running on http://localhost:${portToTry}`);
  });
};

// Initial setup
const init = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Middleware
    app.use(cors({
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,  // Important for cookie support
      methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Browser-Id']
    }));
    app.use(cookieParser());  // Add cookie parser for browser ID
    app.use(express.json());

    // Routes
    app.use("/api/files", fileRoutes);
    app.use("/api/visits", visitorRoutes);  // Add visitor routes
    
    // Default route
    app.get("/", (req, res) => {
      res.send("Sales Analytics API is running");
    });

    // Error handler
    app.use(errorHandler);

    // Start server - use the PORT provided by Render
    const initialPort = parseInt(process.env.PORT) || 5000;
    startServer(initialPort);
    
  } catch (err) {
    logger.error("Failed to initialize server:", err);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = () => {
  logger.info("Shutting down gracefully...");
  if (server) {
    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      logger.error("Could not close connections in time, forcing shutdown");
      process.exit(1);
    }, 10000);
  }
};

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the application
init();