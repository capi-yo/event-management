/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/components/theme-provider";
import LocationPicker from "@/components/LocationPicker";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Upload,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { eventsApi } from "@/lib/api";
import { FeedbackButton } from "@/components/FeedbackButton";
import { useButtonFeedback } from "@/hooks/useButtonFeedback";
import PriceDisplay from "@/components/PriceDisplay";
import {
  discountFieldsFromPercentage,
  validateDiscountPercentage,
} from "@/lib/pricing";

export default function OrganiserCreateEventPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const createFeedback = useButtonFeedback();
  const [uploading, setUploading] = useState(false);
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    date: "",
    time: "",
    location: "",
    city: "",
    country: "",
    capacity: "",
    image_url: "",
    isFree: true,
    ticketCategories: [
      { name: "General Admission", price: "0", capacity: "100", discountPercentage: "0" },
    ],
    location_latitude: 9.032,
    location_longitude: 38.7469,
  });

  // Redirect if not organizer or admin
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crimson"></div>
      </div>
    );
  }

  if (
    !user ||
    (user.role !== "Organizer" && user.role !== "Administrator")
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You need to be an organizer to create events.
          </p>
          <Button asChild className="bg-crimson hover:bg-crimson-dark">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const updateFormData = (field: string, value: any) => {
    console.log("updateFormData called:", field, value);
    setFormData({ ...formData, [field]: value });
  };

  const addTicketCategory = () => {
    setFormData({
      ...formData,
      ticketCategories: [
        ...formData.ticketCategories,
        { name: "", price: "", capacity: "", discountPercentage: "0" },
      ],
    });
  };

  const removeTicketCategory = (index: number) => {
    setFormData({
      ...formData,
      ticketCategories: formData.ticketCategories.filter((_, i) => i !== index),
    });
  };

  const updateTicketCategory = (
    index: number,
    field: string,
    value: string,
  ) => {
    const updated = [...formData.ticketCategories];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, ticketCategories: updated });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError("");
      const res = await eventsApi.uploadImage(file);
      if (res.success) {
        updateFormData("image_url", res.data.imageUrl);
      } else {
        setError("Failed to upload image. Please try again.");
      }
    } catch (err: any) {
      console.error("Image upload error:", err);
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      console.log("Form data before submit:", {
        location_latitude: formData.location_latitude,
        location_longitude: formData.location_longitude,
      });

      const eventData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        date: formData.date,
        time: formData.time,
        location_venue: formData.location,
        location_latitude: formData.location_latitude,
        location_longitude: formData.location_longitude,
        city: formData.city,
        country: formData.country,
        image_url: formData.image_url,
        capacity:
          parseInt(formData.capacity) ||
          (formData.isFree
            ? 0
            : formData.ticketCategories.reduce(
                (sum, cat) => sum + (parseInt(cat.capacity) || 0),
                0,
              )),
        is_paid: !formData.isFree,
        ticket_categories: formData.isFree
          ? []
          : formData.ticketCategories.map((cat) => {
              const discount = discountFieldsFromPercentage(
                cat.discountPercentage ?? "0",
              );
              return {
                name: cat.name,
                price: parseFloat(cat.price) || 0,
                capacity: parseInt(cat.capacity) || 0,
                discount_percentage: discount.discount_value,
                discount_type: discount.discount_type,
                discount_value: discount.discount_value,
              };
            }),
      };

      console.log("Event data being sent:", eventData);
      await eventsApi.create(eventData);
      setSuccess(true);
      createFeedback.showConfirmed();

      setTimeout(() => {
        router.push("/organiser/events");
      }, 2000);
    } catch (err: any) {
      console.error("Create event error:", err);
      // If the error response has specific validation errors, show them
      if (err.errors && Array.isArray(err.errors)) {
        const errorMsg = err.errors.map((e: any) => e.message).join(". ");
        setError(`Validation failed: ${errorMsg}`);
      } else {
        setError(err.message || "Failed to create event. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.title && formData.description && formData.category;
      case 2:
        return formData.date && formData.time && formData.location;
      case 3:
        if (formData.isFree) return true;
        return (
          formData.ticketCategories.length > 0 &&
          formData.ticketCategories.every((cat) => {
            if (!cat.name || !cat.price || !cat.capacity) return false;
            return !validateDiscountPercentage(cat.discountPercentage ?? "0");
          })
        );
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <p>Event created successfully! Redirecting to your events...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className={`text-3xl font-bold tracking-tight ${theme === "dark" ? "text-slate-100" : ""}`}
          >
            Create Event
          </h1>
          <p
            className={
              theme === "dark" ? "text-slate-400" : "text-muted-foreground"
            }
          >
            Set up a new event for your attendees
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {[
              { step: 1, title: "Basic Info" },
              { step: 2, title: "Date & Location" },
              { step: 3, title: "Tickets" },
              { step: 4, title: "Review" },
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    step >= item.step
                      ? "border-red-600 bg-red-600 text-white"
                      : theme === "dark"
                        ? "border-slate-700 text-slate-500"
                        : "border-gray-300 text-gray-400"
                  }`}
                >
                  {step > item.step ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="font-medium">{item.step}</span>
                  )}
                </div>
                <span
                  className={`ml-2 hidden sm:inline ${
                    step >= item.step
                      ? theme === "dark"
                        ? "text-slate-100"
                        : ""
                      : theme === "dark"
                        ? "text-slate-500"
                        : "text-gray-400"
                  }`}
                >
                  {item.title}
                </span>
                {index < 3 && (
                  <div
                    className={`w-12 sm:w-24 h-0.5 mx-2 ${
                      step > item.step
                        ? "bg-red-600"
                        : theme === "dark"
                          ? "bg-slate-700"
                          : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {step === 1 && (
        <Card
          className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}
        >
          <CardHeader>
            <CardTitle className={theme === "dark" ? "text-slate-100" : ""}>
              Basic Information
            </CardTitle>
            <CardDescription
              className={theme === "dark" ? "text-slate-400" : ""}
            >
              Enter the basic details of your event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="title"
                className={theme === "dark" ? "text-slate-300" : ""}
              >
                Event Title *
              </Label>
              <Input
                id="title"
                placeholder="Enter event title"
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
                className={
                  theme === "dark" ? "bg-slate-800 border-slate-700" : ""
                }
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className={theme === "dark" ? "text-slate-300" : ""}
              >
                Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your event..."
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                className={
                  theme === "dark" ? "bg-slate-800 border-slate-700" : ""
                }
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="category"
                className={theme === "dark" ? "text-slate-300" : ""}
              >
                Category *
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => updateFormData("category", value)}
              >
                <SelectTrigger
                  className={
                    theme === "dark" ? "bg-slate-800 border-slate-700" : ""
                  }
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Music">Music</SelectItem>
                  <SelectItem value="Art">Art</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className={theme === "dark" ? "text-slate-300" : ""}>
                Event Cover Image
              </Label>
              <div className="flex flex-col gap-4">
                <div
                  className={`relative aspect-video rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center ${
                    theme === "dark"
                      ? "border-slate-800 bg-slate-800/50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  {formData.image_url ? (
                    <>
                      <img
                        src={
                          formData.image_url.startsWith("http")
                            ? formData.image_url
                            : `${API_BASE_URL}${formData.image_url}`
                        }
                        alt="Event Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => updateFormData("image_url", "")}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-6">
                      <Upload
                        className={`mx-auto h-12 w-12 mb-2 ${theme === "dark" ? "text-slate-600" : "text-gray-300"}`}
                      />
                      <p
                        className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-gray-500"}`}
                      >
                        Upload an image for your event
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="image-upload"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center gap-2"
                      onClick={() =>
                        document.getElementById("image-upload")?.click()
                      }
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {formData.image_url
                        ? "Change Image"
                        : "Upload from Device"}
                    </Button>
                  </div>
                  <div className="flex-2">
                    <Input
                      id="image_url"
                      placeholder="Or paste an image URL..."
                      value={formData.image_url}
                      onChange={(e) =>
                        updateFormData("image_url", e.target.value)
                      }
                      className={
                        theme === "dark" ? "bg-slate-800 border-slate-700" : ""
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card
          className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}
        >
          <CardHeader>
            <CardTitle className={theme === "dark" ? "text-slate-100" : ""}>
              Date & Location
            </CardTitle>
            <CardDescription
              className={theme === "dark" ? "text-slate-400" : ""}
            >
              When and where will your event take place?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="date"
                  className={theme === "dark" ? "text-slate-300" : ""}
                >
                  Event Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateFormData("date", e.target.value)}
                  className={
                    theme === "dark" ? "bg-slate-800 border-slate-700" : ""
                  }
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="time"
                  className={theme === "dark" ? "text-slate-300" : ""}
                >
                  Event Time *
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => updateFormData("time", e.target.value)}
                  className={
                    theme === "dark" ? "bg-slate-800 border-slate-700" : ""
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="location"
                className={theme === "dark" ? "text-slate-300" : ""}
              >
                Venue Name *
              </Label>
              <LocationAutocomplete
                value={formData.location}
                onChange={(value) => updateFormData("location", value)}
                onSelect={({ name, lat, lng, city, country }) => {
                  setFormData((prev) => ({
                    ...prev,
                    location: name,
                    city: city || prev.city,
                    country: country || prev.country,
                    location_latitude: lat,
                    location_longitude: lng,
                  }));
                }}
                placeholder="Type venue or area name"
                className={
                  theme === "dark" ? "bg-slate-800 border-slate-700" : ""
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="city"
                  className={theme === "dark" ? "text-slate-300" : ""}
                >
                  City
                </Label>
                <Input
                  id="city"
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={(e) => updateFormData("city", e.target.value)}
                  className={
                    theme === "dark" ? "bg-slate-800 border-slate-700" : ""
                  }
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="country"
                  className={theme === "dark" ? "text-slate-300" : ""}
                >
                  Country
                </Label>
                <Input
                  id="country"
                  placeholder="Enter country"
                  value={formData.country}
                  onChange={(e) => updateFormData("country", e.target.value)}
                  className={
                    theme === "dark" ? "bg-slate-800 border-slate-700" : ""
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={theme === "dark" ? "text-slate-300" : ""}>
                Select Location on Map
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Click on the map to set the exact location of your event
              </p>
              <LocationPicker
                latitude={formData.location_latitude}
                longitude={formData.location_longitude}
                locationLabel={formData.location}
                onLocationSelect={(lat, lng) => {
                  setFormData((prev) => ({
                    ...prev,
                    location_latitude: lat,
                    location_longitude: lng,
                  }));
                }}
                onPlaceSelect={({ display_name, lat, lng, city, country }) => {
                  setFormData((prev) => ({
                    ...prev,
                    location: display_name,
                    city: city || prev.city,
                    country: country || prev.country,
                    location_latitude: lat,
                    location_longitude: lng,
                  }));
                }}
                height="400px"
              />
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label className="text-xs text-gray-500">Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.location_latitude}
                    onChange={(e) =>
                      updateFormData(
                        "location_latitude",
                        parseFloat(e.target.value),
                      )
                    }
                    className={`text-sm ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.location_longitude}
                    onChange={(e) =>
                      updateFormData(
                        "location_longitude",
                        parseFloat(e.target.value),
                      )
                    }
                    className={`text-sm ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="capacity"
                className={theme === "dark" ? "text-slate-300" : ""}
              >
                Total Capacity
              </Label>
              <Input
                id="capacity"
                type="number"
                placeholder="Maximum number of attendees (0 = unlimited)"
                value={formData.capacity}
                onChange={(e) => updateFormData("capacity", e.target.value)}
                className={
                  theme === "dark" ? "bg-slate-800 border-slate-700" : ""
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card
          className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}
        >
          <CardHeader>
            <CardTitle className={theme === "dark" ? "text-slate-100" : ""}>
              Tickets
            </CardTitle>
            <CardDescription
              className={theme === "dark" ? "text-slate-400" : ""}
            >
              Set up your ticket types and pricing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="isFree"
                checked={formData.isFree}
                onChange={(e) => updateFormData("isFree", e.target.checked)}
                className="w-4 h-4"
              />
              <Label
                htmlFor="isFree"
                className={theme === "dark" ? "text-slate-300" : ""}
              >
                This is a free event
              </Label>
            </div>

            {!formData.isFree && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3
                    className={`font-semibold ${theme === "dark" ? "text-slate-200" : ""}`}
                  >
                    Ticket Categories
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTicketCategory}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.ticketCategories.map((category, index) => {
                    const discountError = validateDiscountPercentage(
                      category.discountPercentage ?? "0",
                    );
                    const discount = discountFieldsFromPercentage(
                      category.discountPercentage ?? "0",
                    );

                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${theme === "dark" ? "border-slate-800 bg-slate-800/50" : "bg-slate-50"} space-y-4`}
                      >
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                          <div className="flex-1 space-y-2 w-full">
                            <Label className="text-xs">Category Name</Label>
                            <Input
                              placeholder="e.g. Early Bird"
                              value={category.name}
                              onChange={(e) =>
                                updateTicketCategory(index, "name", e.target.value)
                              }
                              className={
                                theme === "dark" ? "bg-slate-900" : "bg-white"
                              }
                            />
                          </div>
                          <div className="w-full sm:w-28 space-y-2">
                            <Label className="text-xs">Price (ETB)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={category.price}
                              onChange={(e) =>
                                updateTicketCategory(index, "price", e.target.value)
                              }
                              className={
                                theme === "dark" ? "bg-slate-900" : "bg-white"
                              }
                            />
                          </div>
                          <div className="w-full sm:w-28 space-y-2">
                            <Label className="text-xs">Discount (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              placeholder="0"
                              value={category.discountPercentage ?? "0"}
                              onChange={(e) =>
                                updateTicketCategory(
                                  index,
                                  "discountPercentage",
                                  e.target.value,
                                )
                              }
                              className={
                                theme === "dark" ? "bg-slate-900" : "bg-white"
                              }
                            />
                          </div>
                          <div className="w-full sm:w-24 space-y-2">
                            <Label className="text-xs">Capacity</Label>
                            <Input
                              type="number"
                              min="0"
                              placeholder="100"
                              value={category.capacity}
                              onChange={(e) =>
                                updateTicketCategory(
                                  index,
                                  "capacity",
                                  e.target.value,
                                )
                              }
                              className={
                                theme === "dark" ? "bg-slate-900" : "bg-white"
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTicketCategory(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            disabled={formData.ticketCategories.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {discountError && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {discountError}
                          </p>
                        )}
                        {parseFloat(category.price) > 0 && (
                          <div
                            className={`flex items-center justify-between gap-4 p-3 rounded-md border ${theme === "dark" ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-white"}`}
                          >
                            <p
                              className={`text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}
                            >
                              Price preview
                            </p>
                            <PriceDisplay
                              price={category.price}
                              discountType={discount.discount_type}
                              discountValue={discount.discount_value}
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {formData.isFree && (
              <div
                className={`p-4 rounded-lg ${theme === "dark" ? "bg-slate-800" : "bg-slate-50"}`}
              >
                <p className={theme === "dark" ? "text-slate-300" : ""}>
                  This will be a free event. Attendees can register without
                  payment.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card
          className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}
        >
          <CardHeader>
            <CardTitle className={theme === "dark" ? "text-slate-100" : ""}>
              Review & Submit
            </CardTitle>
            <CardDescription
              className={theme === "dark" ? "text-slate-400" : ""}
            >
              Review your event details before submitting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={`p-4 rounded-lg ${theme === "dark" ? "bg-slate-800" : "bg-slate-50"}`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-slate-100" : ""}`}
              >
                Event Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p
                    className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}
                  >
                    Title
                  </p>
                  <p className={theme === "dark" ? "text-slate-100" : ""}>
                    {formData.title || "Not set"}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}
                  >
                    Category
                  </p>
                  <p className={theme === "dark" ? "text-slate-100" : ""}>
                    {formData.category || "Not set"}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}
                  >
                    Date & Time
                  </p>
                  <p className={theme === "dark" ? "text-slate-100" : ""}>
                    {formData.date} at {formData.time || "Not set"}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}
                  >
                    Location
                  </p>
                  <p className={theme === "dark" ? "text-slate-100" : ""}>
                    {formData.location}, {formData.city}, {formData.country}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}
                  >
                    Total Capacity
                  </p>
                  <p className={theme === "dark" ? "text-slate-100" : ""}>
                    {formData.isFree
                      ? formData.capacity || "Unlimited"
                      : formData.ticketCategories.reduce(
                          (sum, cat) => sum + (parseInt(cat.capacity) || 0),
                          0,
                        )}{" "}
                    attendees
                  </p>
                </div>
                <div>
                  <p
                    className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}
                  >
                    Pricing
                  </p>
                  {formData.isFree ? (
                    <p className={theme === "dark" ? "text-slate-100" : ""}>
                      Free Event
                    </p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {formData.ticketCategories.map((cat, i) => {
                        const discount = discountFieldsFromPercentage(
                          cat.discountPercentage ?? "0",
                        );
                        return (
                          <div
                            key={i}
                            className={`flex items-center justify-between gap-4 p-2 rounded-md ${theme === "dark" ? "bg-slate-900/50" : "bg-white"}`}
                          >
                            <span
                              className={`text-sm font-medium ${theme === "dark" ? "text-slate-200" : ""}`}
                            >
                              {cat.name || `Category ${i + 1}`}
                            </span>
                            <PriceDisplay
                              price={cat.price}
                              discountType={discount.discount_type}
                              discountValue={discount.discount_value}
                              size="sm"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              {formData.image_url && (
                <div className="mt-4">
                  <p
                    className={`text-sm mb-2 ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}
                  >
                    Event Cover
                  </p>
                  <div className="aspect-video w-full max-w-md rounded-lg overflow-hidden border">
                    <img
                      src={
                        formData.image_url.startsWith("http")
                          ? formData.image_url
                          : `${API_BASE_URL}${formData.image_url}`
                      }
                      alt="Event Cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div>
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className={
                theme === "dark" ? "border-slate-700 hover:bg-slate-800" : ""
              }
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
        </div>
        <div>
          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <FeedbackButton
              onClick={handleSubmit}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              loading={loading}
              feedback={createFeedback.feedback}
              defaultLabel="Create Event"
              loadingLabel="Creating..."
              confirmedLabel="Confirmed"
              icon={CheckCircle}
            />
          )}
        </div>
      </div>
    </div>
  );
}
