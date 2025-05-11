import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Bookshelf } from "@/lib/types";

interface BookFormProps {
  initialBookshelfId?: number;
  initialShelf?: number;
  initialPosition?: number;
  bookshelves: Bookshelf[];
  onSuccess?: (bookshelfId: number) => void;
}

export function BookForm({
  initialBookshelfId,
  initialShelf = 0,
  initialPosition = 0,
  bookshelves,
  onSuccess
}: BookFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define the form schema using zod
  const formSchema = z.object({
    title: z.string().min(1, { message: t('bookForm.titleRequired') }),
    author: z.string().min(1, { message: t('bookForm.authorRequired') }),
    isbn: z.string().default("0000000000000"),
    category: z.string().optional(),
    description: z.string().optional(),
    coverImage: z.string().optional(),
    bookshelfId: z.number().min(1, { message: t('bookForm.bookshelfRequired') }),
    shelfPosition: z.object({
      shelf: z.number().min(1, { message: t('bookForm.shelfRequiredError') }),
      position: z.number().min(1, { message: t('bookForm.positionRequiredError') })
    })
  });

  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: "",
      author: "",
      isbn: "0000000000000",
      category: "",
      description: "",
      coverImage: "",
      bookshelfId: initialBookshelfId || undefined,
      shelfPosition: {
        shelf: initialShelf + 1,
        position: initialPosition + 1
      }
    }
  });

  const selectedBookshelfId = form.watch("bookshelfId");
  const selectedBookshelf = bookshelves.find(bs => bs.id === selectedBookshelfId);
  const numShelves = selectedBookshelf?.numShelves ?? 0;
  const positionsPerShelf = 10; // Using a fixed default value for now

  // Reset shelf/position if bookshelf changes and current selection is invalid
  useEffect(() => {
    if (selectedBookshelf) {
      const currentShelf = form.getValues("shelfPosition.shelf");
      const currentPosition = form.getValues("shelfPosition.position");
      if (currentShelf > (selectedBookshelf.numShelves ?? 0)) {
        form.setValue("shelfPosition.shelf", 1);
      }
      if (currentPosition > positionsPerShelf) { // Using the fixed value from above
        form.setValue("shelfPosition.position", 1);
      }
    }
  }, [selectedBookshelfId, form, selectedBookshelf, numShelves, positionsPerShelf]); // Added numShelves and positionsPerShelf to dependency array

  // Available book categories
  const bookCategories = [
    "科幻", "小说", "文学", "历史", "心理学", "科普", "传记", "艺术", "经济", 
    "哲学", "政治", "社会学", "自然科学", "计算机", "教育", "童书"
  ];

  // Sample cover images for demonstration
  const sampleCoverImages = [
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300",
    "https://images.unsplash.com/photo-1541963463532-d68292c34b19?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300",
    "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300",
    "https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300",
    "https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300"
  ];

  // Submit handler
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      const processedData = {
        ...data,
        isbn: data.isbn || "0000000000000",
      };

      let coverImageToUse = processedData.coverImage;
      if (!coverImageToUse && sampleCoverImages.length > 0) {
        coverImageToUse = sampleCoverImages[Math.floor(Math.random() * sampleCoverImages.length)];
      }
      
      // Construct payload matching CreateBookRequest DTO
      // CreateBookRequest: title, author, isbn, publisher, publicationDate, genre, coverImageUrl, description, bookshelfId, shelfNumber, positionOnShelf
      const apiPayload = {
        title: processedData.title,
        author: processedData.author,
        isbn: processedData.isbn,
        publisher: undefined,
        publicationDate: undefined,
        genre: processedData.category,
        coverImageUrl: coverImageToUse,
        coverImage: coverImageToUse,
        summary: processedData.description,
        description: processedData.description,
        bookshelfId: processedData.bookshelfId,
        shelfNumber: processedData.shelfPosition.shelf,
        positionOnShelf: processedData.shelfPosition.position,
      };
      
      // Send the data to the API
      await apiRequest("POST", "/api/books", apiPayload);
      
      // Handle success
      toast({
        title: t('bookForm.success'),
        description: t('bookForm.bookAdded'),
      });
      
      // Invalidate books query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookshelves', apiPayload.bookshelfId, 'books'] });
      queryClient.invalidateQueries({ queryKey: ['/api/books', { bookshelfId: apiPayload.bookshelfId }] });
      
      // Call onSuccess callback
      if (onSuccess) {
        onSuccess(apiPayload.bookshelfId as number);
      }
    } catch (error: any) {
      console.error("Failed to add book:", error);
      const errorMessage = error?.response?.data?.message || t('bookForm.errorAdding');
      toast({
        title: t('bookForm.error'),
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormField
              control={form.control as any}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('bookForm.title')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('bookForm.titlePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control as any}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('bookForm.author')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('bookForm.authorPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control as any}
              name="isbn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('bookForm.isbn')}</FormLabel>
                  <FormControl>
                    <Input placeholder="9787XXXXXXXXX" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control as any}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('bookForm.category')}</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('bookForm.selectCategory')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bookCategories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control as any}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('bookForm.coverImage')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('bookForm.coverImagePlaceholder')} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {sampleCoverImages.map((image, index) => (
                      <div 
                        key={index}
                        className={`cursor-pointer border-2 rounded p-1 ${field.value === image ? 'border-primary' : 'border-transparent hover:border-gray-300'}`}
                        onClick={() => form.setValue('coverImage', image, { shouldValidate: true })}
                      >
                        <img 
                          src={image} 
                          alt={`Sample cover ${index + 1}`} 
                          className="h-16 w-full object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-4">
            <FormField
              control={form.control as any}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('bookForm.description')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('bookForm.descriptionPlaceholder')} 
                      className="h-32"
                      {...field} 
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control as any}
              name="bookshelfId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('bookForm.bookshelf')}</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('bookForm.selectBookshelf')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bookshelves.map(shelf => (
                        <SelectItem key={shelf.id} value={shelf.id.toString()}>
                          {shelf.name} ({shelf.isPrivate ? t('bookshelves.personal') : t('bookshelves.family')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedBookshelf && (
              <>
                <FormField
                  control={form.control as any}
                  name="shelfPosition.shelf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('bookForm.shelfNumber')}</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('bookForm.selectShelf')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: numShelves }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}> 
                              {t('bookForm.shelfLabel', { number: i + 1 })} 
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control as any}
                  name="shelfPosition.position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('bookForm.positionOnShelf')}</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('bookForm.selectPosition')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: positionsPerShelf }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {t('bookForm.positionLabel', { number: i + 1 })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        </div>
        
        <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
          {isSubmitting ? (
            <i className="fas fa-spinner fa-spin mr-2"></i>
          ) : (
            <i className="fas fa-plus-circle mr-2"></i> 
          )}
          {t('bookForm.addBookButton')}
        </Button>
      </form>
    </Form>
  );
}
