import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Github, Package, BookOpen, FileCode, Bug } from 'lucide-react';
import { ComponentInfo } from '../../../types/components';

export interface ComponentDetailSheetProps {
  component: ComponentInfo;
}

// Helper function to parse markdown links in text
const parseMarkdownLinks = (text: string): React.ReactNode[] => {
  // Pattern: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;
  
  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++}>
          {text.substring(lastIndex, match.index)}
        </span>
      );
    }
    
    // Add the link
    parts.push(
      <a
        key={key++}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: 'var(--color-panel-link, #3b82f6)',
          textDecoration: 'underline',
        }}
      >
        {match[1]}
      </a>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after the last link
  if (lastIndex < text.length) {
    parts.push(
      <span key={key++}>
        {text.substring(lastIndex)}
      </span>
    );
  }
  
  // If no links found, return the original text
  return parts.length > 0 ? parts : [text];
};

export const ComponentDetailSheet: React.FC<ComponentDetailSheetProps> = ({ component }) => {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [copiedExample, setCopiedExample] = useState<string | null>(null);

  const handleCopy = async (text: string, type: 'command' | 'example') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'command') {
        setCopiedCommand(text);
        setTimeout(() => setCopiedCommand(null), 2000);
      } else {
        setCopiedExample(text);
        setTimeout(() => setCopiedExample(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const installCommand = component.npmPackage ? `npm install ${component.npmPackage}` : '';
  const packageUrl = component.packageUrl || (component.npmPackage ? `https://www.npmjs.com/package/${component.npmPackage}` : null);
  const repoUrl = component.repoUrl || (component.developer && component.npmPackage 
    ? `https://github.com/${component.developer}/${component.npmPackage.split('/').pop()}` 
    : null);

  return (
    <div style={{ 
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
      color: 'var(--color-panel-text)',
    }}>
      {/* Icon/Illustration Section */}
      <div
        style={{
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${component.gradientFrom} 0%, ${component.gradientTo} 100%)`,
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {component.imageUrl ? (
          <img
            src={component.imageUrl}
            alt={component.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
            onError={(e) => {
              // Fallback to icon if image fails to load
              const target = e.currentTarget;
              target.style.display = 'none';
              const iconFallback = target.nextElementSibling as HTMLElement;
              if (iconFallback) {
                iconFallback.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div
          style={{
            display: component.imageUrl ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(0, 0, 0, 0.7)',
            position: component.imageUrl ? 'absolute' : 'relative',
            width: '100%',
            height: '100%',
          }}
          className="cp-component-card-icon"
        >
          {component.icon}
        </div>
      </div>

      {/* Content Section */}
      <div style={{
        padding: '0 24px 24px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
      {/* Header Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 600, 
            margin: 0,
            color: 'var(--color-panel-text)',
          }}>
            {component.title}
          </h1>
          {repoUrl && (
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: 'var(--color-panel-text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-panel-text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
              }}
            >
              <Github size={14} />
              View repo
            </a>
          )}
          {packageUrl && (
            <a
              href={packageUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: 'var(--color-panel-text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-panel-text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
              }}
            >
              <Package size={14} />
              View package
            </a>
          )}
        </div>
        <div style={{ 
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--color-panel-text-muted)',
          textTransform: 'uppercase',
        }}>
          {component.category}
        </div>
      </div>

      {/* Installation Section */}
      {installCommand && (
        <div style={{ 
          backgroundColor: 'var(--color-panel-bg-tertiary)',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid var(--color-panel-border)',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <code style={{
              fontSize: '12px',
              fontFamily: 'monospace',
              color: 'var(--color-panel-text)',
              flex: 1,
              wordBreak: 'break-all',
            }}>
              {installCommand}
            </code>
            <button
              onClick={() => handleCopy(installCommand, 'command')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: copiedCommand === installCommand 
                  ? 'var(--color-panel-success)' 
                  : 'var(--color-panel-text-muted)',
                transition: 'color 0.15s ease',
              }}
              title="Copy command"
            >
              {copiedCommand === installCommand ? (
                <Check size={16} />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <p style={{
          fontSize: '14px',
          lineHeight: '1.6',
          color: 'var(--color-panel-text-secondary)',
          margin: '0 0 12px 0',
        }}>
          {component.longDescription || component.description}
        </p>
        {component.docsUrl && (
          <a
            href={component.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '14px',
              color: 'var(--color-panel-accent)',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            Check out the docs here.
          </a>
        )}
      </div>

      {/* Features */}
      {component.features && component.features.length > 0 && (
        <div>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {component.features.map((feature, index) => {
              // Parse markdown-style bold text (**text**)
              const parts: React.ReactNode[] = [];
              let remaining = feature;
              let key = 0;
              
              while (remaining.length > 0) {
                const boldStart = remaining.indexOf('**');
                if (boldStart === -1) {
                  if (remaining.trim()) {
                    parts.push(
                      <span key={key++} style={{ color: 'var(--color-panel-text-secondary)' }}>
                        {remaining}
                      </span>
                    );
                  }
                  break;
                }
                
                // Add text before bold
                if (boldStart > 0) {
                  parts.push(
                    <span key={key++} style={{ color: 'var(--color-panel-text-secondary)' }}>
                      {remaining.substring(0, boldStart)}
                    </span>
                  );
                }
                
                // Find end of bold
                const boldEnd = remaining.indexOf('**', boldStart + 2);
                if (boldEnd === -1) {
                  // No closing **, treat rest as normal text
                  parts.push(
                    <span key={key++} style={{ color: 'var(--color-panel-text-secondary)' }}>
                      {remaining.substring(boldStart)}
                    </span>
                  );
                  break;
                }
                
                // Add bold text
                const boldText = remaining.substring(boldStart + 2, boldEnd);
                parts.push(
                  <strong key={key++} style={{ 
                    fontWeight: 600, 
                    color: 'var(--color-panel-text)' 
                  }}>
                    {boldText}
                  </strong>
                );
                
                remaining = remaining.substring(boldEnd + 2);
              }
              
              return (
                <li key={index} style={{
                  fontSize: '13px',
                  lineHeight: '1.6',
                }}>
                  {parts.length > 0 ? parts : feature}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Documentation Sections */}
      {component.documentationSections && component.documentationSections.length > 0 && (
        <>
          {component.documentationSections.map((section, sectionIndex) => (
            <div key={sectionIndex} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Section Heading */}
              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--color-panel-text)',
                margin: 0,
              }}>
                {section.heading}
              </h2>

              {/* Section Paragraphs (before code and subsections) */}
              {section.paragraphs && section.paragraphs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {section.paragraphs.map((paragraph, pIndex) => (
                    <p
                      key={pIndex}
                      style={{
                        fontSize: '15px',
                        lineHeight: '1.6',
                        color: 'var(--color-panel-text-secondary)',
                        margin: 0,
                      }}
                    >
                      {parseMarkdownLinks(paragraph)}
                    </p>
                  ))}
                </div>
              )}

              {/* Section Code Block (single code field - before subsections) */}
              {section.code && !section.codeBlocks && (
                <div style={{
                  backgroundColor: '#24292e',
                  borderRadius: '6px',
                  padding: '16px',
                  position: 'relative',
                  border: '1px solid var(--color-panel-border)',
                }}>
                  <pre style={{
                    margin: 0,
                    padding: 0,
                    overflow: 'auto',
                  }}>
                    <code style={{
                      fontSize: '14px',
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                      color: '#e1e4e8',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {section.code}
                    </code>
                  </pre>
                  <button
                    onClick={() => handleCopy(section.code!, 'example')}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: copiedExample === section.code
                        ? '#28a745'
                        : '#8b949e',
                      transition: 'color 0.15s ease',
                    }}
                    title="Copy code"
                  >
                    {copiedExample === section.code ? (
                      <Check size={18} />
                    ) : (
                      <Copy size={18} />
                    )}
                  </button>
                </div>
              )}

              {/* Subsections */}
              {section.subsections && section.subsections.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {section.subsections.map((subsection, subIndex) => (
                    <div key={subIndex} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {subsection.subheading && (
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: 600,
                          color: 'var(--color-panel-text)',
                          margin: 0,
                        }}>
                          {subsection.subheading}
                        </h3>
                      )}
                      {subsection.paragraphs && subsection.paragraphs.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {subsection.paragraphs.map((paragraph, pIndex) => (
                            <p
                              key={pIndex}
                              style={{
                                fontSize: '15px',
                                lineHeight: '1.6',
                                color: 'var(--color-panel-text-secondary)',
                                margin: 0,
                              }}
                            >
                              {parseMarkdownLinks(paragraph)}
                            </p>
                          ))}
                        </div>
                      )}
                      {subsection.code && (
                        <div style={{
                          backgroundColor: '#24292e',
                          borderRadius: '6px',
                          padding: '16px',
                          position: 'relative',
                          border: '1px solid var(--color-panel-border)',
                        }}>
                          <pre style={{
                            margin: 0,
                            padding: 0,
                            overflow: 'auto',
                          }}>
                            <code style={{
                              fontSize: '14px',
                              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                              color: '#e1e4e8',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}>
                              {subsection.code}
                            </code>
                          </pre>
                          <button
                            onClick={() => handleCopy(subsection.code!, 'example')}
                            style={{
                              position: 'absolute',
                              top: '12px',
                              right: '12px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: copiedExample === subsection.code
                                ? '#28a745'
                                : '#8b949e',
                              transition: 'color 0.15s ease',
                            }}
                            title="Copy code"
                          >
                            {copiedExample === subsection.code ? (
                              <Check size={18} />
                            ) : (
                              <Copy size={18} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Section Code Blocks (array - after subsections) */}
              {section.codeBlocks && section.codeBlocks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {section.codeBlocks.map((codeBlock, blockIndex) => (
                    <div key={blockIndex} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {codeBlock.note && !codeBlock.code && (
                        <p style={{
                          fontSize: '15px',
                          lineHeight: '1.6',
                          color: 'var(--color-panel-text-secondary)',
                          margin: 0,
                        }}>
                          {codeBlock.note}
                        </p>
                      )}
                      {codeBlock.code && (
                        <>
                          {codeBlock.note && (
                            <p style={{
                              fontSize: '15px',
                              lineHeight: '1.6',
                              color: 'var(--color-panel-text-secondary)',
                              margin: 0,
                              fontStyle: 'italic',
                            }}>
                              {codeBlock.note}
                            </p>
                          )}
                          <div style={{
                            backgroundColor: '#24292e',
                            borderRadius: '6px',
                            padding: '16px',
                            position: 'relative',
                            border: '1px solid var(--color-panel-border)',
                          }}>
                            <pre style={{
                              margin: 0,
                              padding: 0,
                              overflow: 'auto',
                            }}>
                              <code style={{
                                fontSize: '14px',
                                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                                color: '#e1e4e8',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                              }}>
                                {codeBlock.code}
                              </code>
                            </pre>
                            <button
                              onClick={() => handleCopy(codeBlock.code || '', 'example')}
                              style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: copiedExample === codeBlock.code
                                  ? '#28a745'
                                  : '#8b949e',
                                transition: 'color 0.15s ease',
                              }}
                              title="Copy code"
                            >
                              {copiedExample === codeBlock.code ? (
                                <Check size={18} />
                              ) : (
                                <Copy size={18} />
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Video */}
      {component.videoUrl && (
        <div>
          {component.videoThumbnail ? (
            <a
              href={component.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                borderRadius: '8px',
                overflow: 'hidden',
                textDecoration: 'none',
              }}
            >
              <img
                src={component.videoThumbnail}
                alt={`${component.title} video`}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
            </a>
          ) : (
            <a
              href={component.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                color: 'var(--color-panel-accent)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Watch video <ExternalLink size={14} />
            </a>
          )}
        </div>
      )}

      {/* Stack Post */}
      {component.stackPostUrl && (
        <div>
          <a
            href={component.stackPostUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '14px',
              color: 'var(--color-panel-accent)',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            Read the associated Stack post here.
          </a>
        </div>
      )}

      {/* Example Commands */}
      {component.exampleCommands && component.exampleCommands.length > 0 && (
        <div>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-panel-text)',
            margin: '0 0 12px 0',
          }}>
            Play with the example:
          </h3>
          <div style={{
            backgroundColor: 'var(--color-panel-bg-tertiary)',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid var(--color-panel-border)',
            position: 'relative',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {component.exampleCommands.map((command, index) => (
                <code
                  key={index}
                  style={{
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: 'var(--color-panel-text)',
                    wordBreak: 'break-all',
                    display: 'block',
                  }}
                >
                  {command}
                </code>
              ))}
            </div>
            <button
              onClick={() => handleCopy(component.exampleCommands!.join('\n'), 'example')}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: copiedExample === component.exampleCommands!.join('\n')
                  ? 'var(--color-panel-success)' 
                  : 'var(--color-panel-text-muted)',
                transition: 'color 0.15s ease',
              }}
              title="Copy all commands"
            >
              {copiedExample === component.exampleCommands!.join('\n') ? (
                <Check size={16} />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Documentation Links */}
      {component.docsLinks && component.docsLinks.length > 0 && (
        <div>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-panel-text)',
            margin: '0 0 12px 0',
          }}>
            Documentation
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            {component.docsLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--color-panel-text-secondary)',
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-panel-text)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
                }}
              >
                <BookOpen size={14} />
                {link.label}
                <ExternalLink size={12} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Docs Link */}
      {component.docsUrl && !component.docsLinks && (
        <div>
          <a
            href={component.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: 'var(--color-panel-accent)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            Read the docs for more details.
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      {/* Bug Report */}
      {component.bugReportUrl && (
        <div>
          <a
            href={component.bugReportUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--color-panel-text-secondary)',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-panel-text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
            }}
          >
            <Bug size={14} />
            Found a bug? Feature request? File it here.
            <ExternalLink size={12} />
          </a>
        </div>
      )}
      </div>
      {/* End Content Section */}
    </div>
  );
};
