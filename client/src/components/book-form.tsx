import { useState } from "react";
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
  onSuccess?: () => void;
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
    isbn: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    coverImage: z.string().optional(),
    bookshelfId: z.number().min(1, { message: t('bookForm.bookshelfRequired') }),
    shelfPosition: z.object({
      shelf: z.number(),
      position: z.number()
    })
  });

  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      author: "",
      isbn: "",
      category: "",
      description: "",
      coverImage: "",
      bookshelfId: initialBookshelfId || 0,
      shelfPosition: {
        shelf: initialShelf,
        position: initialPosition
      }
    }
  });

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
      
      // Add a default cover if none is provided
      if (!data.coverImage) {
        data.coverImage = sampleCoverImages[Math.floor(Math.random() * sampleCoverImages.length)];
      }
      
      // Set up the book data
      const bookData = {
        ...data,
        addedById: 1, // Assuming current user ID is 1
        status: "available"
      };
      
      // Send the data to the API
      await apiRequest("POST", "/api/books", bookData);
      
      // Handle success
      toast({
        title: t('bookForm.success'),
        description: t('bookForm.bookAdded'),
      });
      
      // Invalidate books query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      
      // Call onSuccess callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to add book:", error);
      toast({
        title: t('bookForm.error'),
        description: t('bookForm.errorAdding'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
              name="isbn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('bookForm.isbn')}</FormLabel>
                  <FormControl>
                    <Input placeholder="9787XXXXXXXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
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
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('bookForm.coverImage')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('bookForm.coverImagePlaceholder')} {...field} />
                  </FormControl>
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {sampleCoverImages.map((image, index) => (
                      <div 
                        key={index}
                        className={`cursor-pointer border-2 rounded p-1 ${field.value === image ? 'border-primary' : 'border-transparent hover:border-gray-300'}`}
                        onClick={() => form.setValue('coverImage', image)}
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
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('bookForm.description')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('bookForm.descriptionPlaceholder')} 
                      className="h-32"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bookshelfId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('bookForm.bookshelf')}</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('bookForm.selectBookshelf')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bookshelves.map(bookshelf => (
                        <SelectItem key={bookshelf.id} value={bookshelf.id.toString()}>
                          {bookshelf.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shelfPosition.shelf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('bookForm.shelf')}</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('bookForm.selectShelf')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 3 }).map((_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {t('bookForm.shelfNumber', { number: i + 1 })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="shelfPosition.position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('bookForm.position')}</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('bookForm.selectPosition')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {t('bookForm.positionNumber', { number: i + 1 })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    {t('bookForm.adding')}
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus mr-2"></i>
                    {t('bookForm.addBook')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
