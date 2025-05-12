import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCorsOptions } from "../_shared/index.ts";

// OpenAPI specification for our API
const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "ElevenLabs Call Stats API",
    description: "API for retrieving and managing call data from ElevenLabs",
    version: "1.0.0",
    contact: {
      name: "API Support"
    }
  },
  servers: [
    {
      url: "https://rzzywdulzfyycivwwfsd.supabase.co/functions/v1",
      description: "Production server"
    }
  ],
  paths: {
    "/get-customer-stats": {
      post: {
        summary: "Get customer statistics",
        description: "Retrieve statistics for customers based on call data",
        operationId: "getCustomerStats",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  agentId: {
                    type: "string",
                    description: "ID of the agent to filter by"
                  }
                },
                required: ["agentId"]
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Customer statistics retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      customerId: {
                        type: "string",
                        format: "uuid",
                        description: "Unique identifier for the customer"
                      },
                      customerName: {
                        type: "string",
                        description: "Name of the customer"
                      },
                      totalCalls: {
                        type: "integer",
                        description: "Total number of calls for this customer"
                      },
                      avgDuration: {
                        type: "number",
                        description: "Average call duration in seconds"
                      },
                      avgSatisfaction: {
                        type: "number",
                        description: "Average satisfaction score (0-10)"
                      },
                      lastCallDate: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                        description: "Date and time of the most recent call"
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Invalid request parameters",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/get-call": {
      post: {
        summary: "Get call details",
        description: "Retrieve detailed information about a specific call",
        operationId: "getCall",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  callId: {
                    type: "string",
                    format: "uuid",
                    description: "ID of the call to retrieve"
                  }
                },
                required: ["callId"]
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Call details retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      format: "uuid"
                    },
                    customer_id: {
                      type: "string",
                      format: "uuid"
                    },
                    customer_name: {
                      type: "string"
                    },
                    agent_id: {
                      type: "string",
                      format: "uuid"
                    },
                    agent_name: {
                      type: "string"
                    },
                    date: {
                      type: "string",
                      format: "date-time"
                    },
                    duration: {
                      type: "integer"
                    },
                    audio_url: {
                      type: "string"
                    },
                    summary: {
                      type: "string"
                    },
                    transcript: {
                      type: "string"
                    },
                    satisfaction_score: {
                      type: "integer"
                    },
                    tags: {
                      type: "array",
                      items: {
                        type: "string"
                      }
                    }
                  }
                }
              }
            }
          },
          "404": {
            description: "Call not found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string"
                    }
                  }
                }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/sync-calls-elevenlabs": {
      post: {
        summary: "Synchronize calls from ElevenLabs",
        description: "Import calls data from ElevenLabs into the system",
        operationId: "syncCalls",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  calls: {
                    type: "array",
                    items: {
                      type: "object"
                    },
                    description: "Array of call data from ElevenLabs"
                  },
                  agentId: {
                    type: "string",
                    description: "ID of the agent associated with these calls"
                  }
                },
                required: ["calls", "agentId"]
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Calls synchronized successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean"
                    },
                    summary: {
                      type: "object",
                      properties: {
                        total: {
                          type: "integer"
                        },
                        success: {
                          type: "integer"
                        },
                        error: {
                          type: "integer"
                        }
                      }
                    },
                    results: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: {
                            type: "string"
                          },
                          success: {
                            type: "boolean"
                          },
                          action: {
                            type: "string"
                          },
                          error: {
                            type: "string"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Supabase authentication token"
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsOptions();
  }

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();
  
  // Return HTML documentation for browser requests
  if (req.headers.get('accept')?.includes('text/html')) {
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>API Documentation</title>
          <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
        </head>
        <body>
          <div id="redoc"></div>
          <script>
            Redoc.init(${JSON.stringify(openApiSpec)}, {}, document.getElementById('redoc'));
          </script>
        </body>
      </html>
    `, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html'
      }
    });
  }
  
  // Return JSON OpenAPI spec for API requests
  return new Response(JSON.stringify(openApiSpec), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
});
